import {
  findUserProgressByUserId,
  saveUserProgress,
} from "./db.js"
import {
  CATEGORY_CONFIGS,
  DEFAULT_PLAYER_STATE,
  getCatalogItemById,
  getFrontendItemIdByDbItemId,
  getMappedShopItemById,
} from "./shopItemMap.js"

const PLAYER_STATE_PROVIDER = String(
  process.env.PLAYER_STATE_PROVIDER || "sqlite"
).trim().toLowerCase()

const MYSQL_DEFAULT_PORT = 3306

export class PlayerStateError extends Error {
  constructor(status, message) {
    super(message)
    this.name = "PlayerStateError"
    this.status = status
  }
}

function normalizeOwnedItemIds(itemIds = []) {
  return Array.from(
    new Set(
      (Array.isArray(itemIds) ? itemIds : [])
        .filter((itemId) => typeof itemId === "string")
        .filter((itemId) => !getCatalogItemById(itemId)?.builtIn)
    )
  )
}

function normalizePlayerState(state = {}) {
  return {
    coins: Math.max(0, Number(state.coins) || 0),
    ownedItemIds: normalizeOwnedItemIds(state.ownedItemIds),
    equippedButtonSkinId: String(
      state.equippedButtonSkinId || DEFAULT_PLAYER_STATE.equippedButtonSkinId
    ),
    equippedArenaThemeId: String(
      state.equippedArenaThemeId || DEFAULT_PLAYER_STATE.equippedArenaThemeId
    ),
    equippedProfileImageId: String(
      state.equippedProfileImageId || DEFAULT_PLAYER_STATE.equippedProfileImageId
    ),
  }
}

function buildPlayerStateResponse(username, state = {}) {
  return {
    user: {
      username: String(username || "Player"),
    },
    state: normalizePlayerState(state),
  }
}

function resolveMappedItemOrThrow(itemId) {
  const mappedItem = getMappedShopItemById(itemId)
  if (!mappedItem) {
    throw new PlayerStateError(400, "Unknown itemId.")
  }

  const catalogItem = getCatalogItemById(itemId)
  if (!catalogItem) {
    throw new PlayerStateError(400, "Unknown itemId.")
  }

  return {
    ...mappedItem,
    catalogItem,
  }
}

function createSqlitePlayerStateStore() {
  return {
    provider: "sqlite",

    async ensurePlayerUser() {},

    async getPlayerState({ user }) {
      const progress = findUserProgressByUserId(user.id)
      return buildPlayerStateResponse(user.username, progress)
    },

    async purchaseItem({ user, itemId }) {
      const mappedItem = resolveMappedItemOrThrow(itemId)
      const currentProgress = findUserProgressByUserId(user.id)

      if (mappedItem.builtIn) {
        throw new PlayerStateError(400, "Built-in items cannot be purchased.")
      }

      if (currentProgress.ownedItemIds.includes(itemId)) {
        throw new PlayerStateError(409, "Item is already owned.")
      }

      if ((Number(currentProgress.coins) || 0) < mappedItem.cost) {
        throw new PlayerStateError(400, "Not enough coins.")
      }

      const nextProgress = saveUserProgress({
        userId: user.id,
        ...currentProgress,
        coins: Math.max(0, (Number(currentProgress.coins) || 0) - mappedItem.cost),
        ownedItemIds: [...currentProgress.ownedItemIds, itemId],
      })

      return buildPlayerStateResponse(user.username, nextProgress)
    },

    async equipItem({ user, itemId }) {
      const mappedItem = resolveMappedItemOrThrow(itemId)
      const currentProgress = findUserProgressByUserId(user.id)
      const isOwned =
        mappedItem.builtIn || currentProgress.ownedItemIds.includes(itemId)

      if (!isOwned) {
        throw new PlayerStateError(403, "Item must be owned before it can be equipped.")
      }

      const nextProgress = {
        ...currentProgress,
      }

      if (mappedItem.type === "button_skin") {
        nextProgress.equippedButtonSkinId = itemId
      }

      if (mappedItem.type === "arena_theme") {
        nextProgress.equippedArenaThemeId = itemId
      }

      if (mappedItem.type === "profile_image") {
        nextProgress.equippedProfileImageId = itemId
      }

      const persistedProgress = saveUserProgress({
        userId: user.id,
        ...nextProgress,
      })

      return buildPlayerStateResponse(user.username, persistedProgress)
    },

    async syncCoins({ user, coins }) {
      const currentProgress = findUserProgressByUserId(user.id)

      saveUserProgress({
        userId: user.id,
        ...currentProgress,
        coins: Math.max(0, Number(coins) || 0),
      })
    },
  }
}

let mysqlPoolPromise = null

function isMySqlProviderEnabled() {
  return PLAYER_STATE_PROVIDER === "mysql"
}

async function getMySqlPool() {
  if (mysqlPoolPromise) return mysqlPoolPromise

  mysqlPoolPromise = (async () => {
    if (!process.env.MYSQL_USER || !process.env.MYSQL_DATABASE) {
      throw new Error("Set MYSQL_USER and MYSQL_DATABASE before using PLAYER_STATE_PROVIDER=mysql.")
    }

    const mysql = await import("mysql2/promise").catch(() => {
      throw new Error("Install mysql2 before using PLAYER_STATE_PROVIDER=mysql.")
    })

    return mysql.createPool({
      host: process.env.MYSQL_HOST || "localhost",
      port: Number(process.env.MYSQL_PORT || MYSQL_DEFAULT_PORT),
      user: process.env.MYSQL_USER || "",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "",
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: false,
    })
  })()

  return mysqlPoolPromise
}

async function findMySqlUserByUsername(executor, username, options = {}) {
  const lockClause = options.forUpdate ? " FOR UPDATE" : ""
  const [rows] = await executor.query(
    `SELECT id, username, coins
     FROM users
     WHERE username = ?
     LIMIT 1${lockClause}`,
    [username]
  )

  return rows[0] || null
}

async function readMySqlCategoryRows(executor, userId, categoryConfig) {
  const [rows] = await executor.query(
    `SELECT ${categoryConfig.itemColumn} AS itemId, equipped
     FROM ${categoryConfig.joinTable}
     WHERE user_id = ?`,
    [userId]
  )

  return rows
}

async function buildMySqlPlayerStateResponse(executor, user) {
  const ownedItemIds = []
  const ownedItemIdSet = new Set()
  const equippedByResponseKey = {
    equippedButtonSkinId: DEFAULT_PLAYER_STATE.equippedButtonSkinId,
    equippedArenaThemeId: DEFAULT_PLAYER_STATE.equippedArenaThemeId,
    equippedProfileImageId: DEFAULT_PLAYER_STATE.equippedProfileImageId,
  }

  for (const categoryConfig of CATEGORY_CONFIGS) {
    const categoryRows = await readMySqlCategoryRows(executor, user.id, categoryConfig)

    categoryRows.forEach((row) => {
      const frontendItemId = getFrontendItemIdByDbItemId(categoryConfig.type, row.itemId)

      if (!frontendItemId) return

      const catalogItem = getCatalogItemById(frontendItemId)
      if (!catalogItem) return

      if (!catalogItem.builtIn && !ownedItemIdSet.has(frontendItemId)) {
        ownedItemIdSet.add(frontendItemId)
        ownedItemIds.push(frontendItemId)
      }

      if (Number(row.equipped) === 1) {
        equippedByResponseKey[categoryConfig.responseKey] = frontendItemId
      }
    })
  }

  return buildPlayerStateResponse(user.username, {
    coins: user.coins,
    ownedItemIds,
    equippedButtonSkinId: equippedByResponseKey.equippedButtonSkinId,
    equippedArenaThemeId: equippedByResponseKey.equippedArenaThemeId,
    equippedProfileImageId: equippedByResponseKey.equippedProfileImageId,
  })
}

function createMySqlPlayerStateStore() {
  return {
    provider: "mysql",

    async ensurePlayerUser(user) {
      if (!user?.username) {
        throw new PlayerStateError(500, "Player identity is missing.")
      }

      const pool = await getMySqlPool()
      const existingUser = await findMySqlUserByUsername(pool, user.username)
      if (existingUser) return existingUser

      if (!user.passwordHash) {
        throw new PlayerStateError(500, "Player state user could not be initialized.")
      }

      await pool.query(
        `INSERT INTO users (username, password_hash, coins, total_clicks)
         VALUES (?, ?, 0, 0)
         ON DUPLICATE KEY UPDATE
           password_hash = VALUES(password_hash)`,
        [user.username, user.passwordHash]
      )

      const createdUser = await findMySqlUserByUsername(pool, user.username)
      if (!createdUser) {
        throw new PlayerStateError(500, "Player state user could not be initialized.")
      }

      return createdUser
    },

    async getPlayerState({ user }) {
      await this.ensurePlayerUser(user)
      const pool = await getMySqlPool()
      const mySqlUser = await findMySqlUserByUsername(pool, user.username)

      if (!mySqlUser) {
        throw new PlayerStateError(404, "Player state was not found.")
      }

      return buildMySqlPlayerStateResponse(pool, mySqlUser)
    },

    async purchaseItem({ user, itemId }) {
      const mappedItem = resolveMappedItemOrThrow(itemId)

      if (mappedItem.builtIn) {
        throw new PlayerStateError(400, "Built-in items cannot be purchased.")
      }

      await this.ensurePlayerUser(user)
      const pool = await getMySqlPool()
      const connection = await pool.getConnection()

      try {
        await connection.beginTransaction()

        const mySqlUser = await findMySqlUserByUsername(connection, user.username, {
          forUpdate: true,
        })

        if (!mySqlUser) {
          throw new PlayerStateError(404, "Player state was not found.")
        }

        const [existingRows] = await connection.query(
          `SELECT 1
           FROM ${mappedItem.joinTable}
           WHERE user_id = ? AND ${mappedItem.itemColumn} = ?
           LIMIT 1`,
          [mySqlUser.id, mappedItem.dbItemId]
        )

        if (existingRows.length > 0) {
          throw new PlayerStateError(409, "Item is already owned.")
        }

        if ((Number(mySqlUser.coins) || 0) < mappedItem.cost) {
          throw new PlayerStateError(400, "Not enough coins.")
        }

        await connection.query(
          `INSERT INTO ${mappedItem.joinTable} (user_id, ${mappedItem.itemColumn}, equipped)
           VALUES (?, ?, 0)`,
          [mySqlUser.id, mappedItem.dbItemId]
        )

        await connection.query(
          `UPDATE users
           SET coins = coins - ?
           WHERE id = ?`,
          [mappedItem.cost, mySqlUser.id]
        )

        await connection.commit()

        const refreshedUser = await findMySqlUserByUsername(connection, user.username)
        return buildMySqlPlayerStateResponse(connection, refreshedUser)
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    },

    async equipItem({ user, itemId }) {
      const mappedItem = resolveMappedItemOrThrow(itemId)

      await this.ensurePlayerUser(user)
      const pool = await getMySqlPool()
      const connection = await pool.getConnection()

      try {
        await connection.beginTransaction()

        const mySqlUser = await findMySqlUserByUsername(connection, user.username, {
          forUpdate: true,
        })

        if (!mySqlUser) {
          throw new PlayerStateError(404, "Player state was not found.")
        }

        if (!mappedItem.builtIn) {
          const [ownedRows] = await connection.query(
            `SELECT 1
             FROM ${mappedItem.joinTable}
             WHERE user_id = ? AND ${mappedItem.itemColumn} = ?
             LIMIT 1`,
            [mySqlUser.id, mappedItem.dbItemId]
          )

          if (ownedRows.length === 0) {
            throw new PlayerStateError(403, "Item must be owned before it can be equipped.")
          }
        }

        await connection.query(
          `UPDATE ${mappedItem.joinTable}
           SET equipped = 0
           WHERE user_id = ?`,
          [mySqlUser.id]
        )

        if (!mappedItem.builtIn) {
          await connection.query(
            `UPDATE ${mappedItem.joinTable}
             SET equipped = 1
             WHERE user_id = ? AND ${mappedItem.itemColumn} = ?`,
            [mySqlUser.id, mappedItem.dbItemId]
          )
        }

        await connection.commit()

        const refreshedUser = await findMySqlUserByUsername(connection, user.username)
        const response = await buildMySqlPlayerStateResponse(connection, refreshedUser)

        if (mappedItem.builtIn) {
          response.state[mappedItem.responseKey] = mappedItem.frontendItemId
        }

        return response
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    },

    async syncCoins({ user, coins }) {
      await this.ensurePlayerUser(user)
      const pool = await getMySqlPool()
      const normalizedCoins = Math.max(0, Number(coins) || 0)

      await pool.query(
        `UPDATE users
         SET coins = ?
         WHERE username = ?`,
        [normalizedCoins, user.username]
      )
    },
  }
}

export function createPlayerStateStore() {
  return isMySqlProviderEnabled()
    ? createMySqlPlayerStateStore()
    : createSqlitePlayerStateStore()
}
