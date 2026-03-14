import fs from "node:fs"
import path from "node:path"

import Database from "better-sqlite3"

const DATA_DIRECTORY = path.join(process.cwd(), "server", "data")
const DATABASE_PATH = path.join(DATA_DIRECTORY, "clickaway.db")
const DEFAULT_PROGRESS = {
  coins: 0,
  levelXp: 0,
  rankMmr: 0,
  ownedItemIds: [],
  equippedButtonSkinId: "skin_button",
  equippedArenaThemeId: "theme_default",
  equippedProfileImageId: "profile_default",
  selectedModeId: "normal",
  roundHistory: [],
  unlockedAchievementIds: [],
}

if (!fs.existsSync(DATA_DIRECTORY)) {
  fs.mkdirSync(DATA_DIRECTORY, { recursive: true })
}

const db = new Database(DATABASE_PATH)

db.pragma("journal_mode = WAL")

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'player',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS user_progress (
    user_id INTEGER PRIMARY KEY,
    coins INTEGER NOT NULL DEFAULT 0,
    level_xp INTEGER NOT NULL DEFAULT 0,
    rank_mmr INTEGER NOT NULL DEFAULT 0,
    owned_item_ids TEXT NOT NULL DEFAULT '[]',
    equipped_button_skin_id TEXT NOT NULL DEFAULT 'skin_button',
    equipped_arena_theme_id TEXT NOT NULL DEFAULT 'theme_default',
    equipped_profile_image_id TEXT NOT NULL DEFAULT 'profile_default',
    selected_mode_id TEXT NOT NULL DEFAULT 'normal',
    round_history TEXT NOT NULL DEFAULT '[]',
    unlocked_achievement_ids TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`)

function parseJsonArray(value) {
  try {
    const parsedValue = JSON.parse(value ?? "[]")
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

function toNonNegativeNumber(value, fallback = 0) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : fallback
}

function normalizeProgressRecord(record) {
  if (!record) {
    return { ...DEFAULT_PROGRESS }
  }

  return {
    coins: toNonNegativeNumber(record.coins, DEFAULT_PROGRESS.coins),
    levelXp: toNonNegativeNumber(record.levelXp, DEFAULT_PROGRESS.levelXp),
    rankMmr: toNonNegativeNumber(record.rankMmr, DEFAULT_PROGRESS.rankMmr),
    ownedItemIds: parseJsonArray(record.ownedItemIds),
    equippedButtonSkinId:
      String(record.equippedButtonSkinId || DEFAULT_PROGRESS.equippedButtonSkinId),
    equippedArenaThemeId:
      String(record.equippedArenaThemeId || DEFAULT_PROGRESS.equippedArenaThemeId),
    equippedProfileImageId:
      String(record.equippedProfileImageId || DEFAULT_PROGRESS.equippedProfileImageId),
    selectedModeId: String(record.selectedModeId || DEFAULT_PROGRESS.selectedModeId),
    roundHistory: parseJsonArray(record.roundHistory),
    unlockedAchievementIds: parseJsonArray(record.unlockedAchievementIds),
  }
}

const findUserByUsernameStatement = db.prepare(`
  SELECT id, username, password_hash AS passwordHash, role
  FROM users
  WHERE username = ?
  COLLATE NOCASE
  LIMIT 1
`)

const findUserByIdStatement = db.prepare(`
  SELECT id, username, role
  FROM users
  WHERE id = ?
  LIMIT 1
`)

const insertUserStatement = db.prepare(`
  INSERT INTO users (username, password_hash, role)
  VALUES (@username, @passwordHash, @role)
`)

const updatePasswordStatement = db.prepare(`
  UPDATE users
  SET password_hash = @passwordHash
  WHERE id = @id
`)

const findUserProgressByUserIdStatement = db.prepare(`
  SELECT
    user_id AS userId,
    coins,
    level_xp AS levelXp,
    rank_mmr AS rankMmr,
    owned_item_ids AS ownedItemIds,
    equipped_button_skin_id AS equippedButtonSkinId,
    equipped_arena_theme_id AS equippedArenaThemeId,
    equipped_profile_image_id AS equippedProfileImageId,
    selected_mode_id AS selectedModeId,
    round_history AS roundHistory,
    unlocked_achievement_ids AS unlockedAchievementIds
  FROM user_progress
  WHERE user_id = ?
  LIMIT 1
`)

const insertUserProgressStatement = db.prepare(`
  INSERT INTO user_progress (
    user_id,
    coins,
    level_xp,
    rank_mmr,
    owned_item_ids,
    equipped_button_skin_id,
    equipped_arena_theme_id,
    equipped_profile_image_id,
    selected_mode_id,
    round_history,
    unlocked_achievement_ids
  ) VALUES (
    @userId,
    @coins,
    @levelXp,
    @rankMmr,
    @ownedItemIds,
    @equippedButtonSkinId,
    @equippedArenaThemeId,
    @equippedProfileImageId,
    @selectedModeId,
    @roundHistory,
    @unlockedAchievementIds
  )
`)

const saveUserProgressStatement = db.prepare(`
  INSERT INTO user_progress (
    user_id,
    coins,
    level_xp,
    rank_mmr,
    owned_item_ids,
    equipped_button_skin_id,
    equipped_arena_theme_id,
    equipped_profile_image_id,
    selected_mode_id,
    round_history,
    unlocked_achievement_ids,
    updated_at
  ) VALUES (
    @userId,
    @coins,
    @levelXp,
    @rankMmr,
    @ownedItemIds,
    @equippedButtonSkinId,
    @equippedArenaThemeId,
    @equippedProfileImageId,
    @selectedModeId,
    @roundHistory,
    @unlockedAchievementIds,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT(user_id) DO UPDATE SET
    coins = excluded.coins,
    level_xp = excluded.level_xp,
    rank_mmr = excluded.rank_mmr,
    owned_item_ids = excluded.owned_item_ids,
    equipped_button_skin_id = excluded.equipped_button_skin_id,
    equipped_arena_theme_id = excluded.equipped_arena_theme_id,
    equipped_profile_image_id = excluded.equipped_profile_image_id,
    selected_mode_id = excluded.selected_mode_id,
    round_history = excluded.round_history,
    unlocked_achievement_ids = excluded.unlocked_achievement_ids,
    updated_at = CURRENT_TIMESTAMP
`)

function serializeProgress(progress = {}) {
  const normalizedProgress = {
    ...DEFAULT_PROGRESS,
    ...progress,
  }

  return {
    userId: toNonNegativeNumber(progress.userId, 0),
    coins: toNonNegativeNumber(normalizedProgress.coins, DEFAULT_PROGRESS.coins),
    levelXp: toNonNegativeNumber(normalizedProgress.levelXp, DEFAULT_PROGRESS.levelXp),
    rankMmr: toNonNegativeNumber(normalizedProgress.rankMmr, DEFAULT_PROGRESS.rankMmr),
    ownedItemIds: JSON.stringify(
      Array.isArray(normalizedProgress.ownedItemIds) ? normalizedProgress.ownedItemIds : []
    ),
    equippedButtonSkinId: String(
      normalizedProgress.equippedButtonSkinId || DEFAULT_PROGRESS.equippedButtonSkinId
    ),
    equippedArenaThemeId: String(
      normalizedProgress.equippedArenaThemeId || DEFAULT_PROGRESS.equippedArenaThemeId
    ),
    equippedProfileImageId: String(
      normalizedProgress.equippedProfileImageId || DEFAULT_PROGRESS.equippedProfileImageId
    ),
    selectedModeId: String(normalizedProgress.selectedModeId || DEFAULT_PROGRESS.selectedModeId),
    roundHistory: JSON.stringify(
      Array.isArray(normalizedProgress.roundHistory) ? normalizedProgress.roundHistory : []
    ),
    unlockedAchievementIds: JSON.stringify(
      Array.isArray(normalizedProgress.unlockedAchievementIds)
        ? normalizedProgress.unlockedAchievementIds
        : []
    ),
  }
}

export function findUserByUsername(username) {
  return findUserByUsernameStatement.get(username) || null
}

export function findUserById(id) {
  return findUserByIdStatement.get(id) || null
}

export function createUser({ username, passwordHash, role = "player" }) {
  const result = insertUserStatement.run({
    username,
    passwordHash,
    role,
  })

  createDefaultUserProgress(result.lastInsertRowid)
  return findUserById(result.lastInsertRowid)
}

export function updateUserPassword({ id, passwordHash }) {
  updatePasswordStatement.run({ id, passwordHash })
}

export function createDefaultUserProgress(userId) {
  const existingProgress = findUserProgressByUserIdStatement.get(userId)
  if (existingProgress) {
    return normalizeProgressRecord(existingProgress)
  }

  insertUserProgressStatement.run({
    userId,
    ...serializeProgress({ ...DEFAULT_PROGRESS, userId }),
  })

  return { ...DEFAULT_PROGRESS }
}

export function findUserProgressByUserId(userId) {
  const existingProgress = findUserProgressByUserIdStatement.get(userId)
  if (!existingProgress) {
    return createDefaultUserProgress(userId)
  }

  return normalizeProgressRecord(existingProgress)
}

export function saveUserProgress({ userId, ...progress }) {
  saveUserProgressStatement.run(serializeProgress({ userId, ...progress }))
  return findUserProgressByUserId(userId)
}
