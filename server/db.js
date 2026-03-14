import fs from "node:fs"
import path from "node:path"

import Database from "better-sqlite3"

const DATA_DIRECTORY = path.join(process.cwd(), "server", "data")
const DATABASE_PATH = path.join(DATA_DIRECTORY, "clickaway.db")

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
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`)

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

const insertDefaultUserProgressStatement = db.prepare(`
  INSERT INTO user_progress (user_id, rank_mmr)
  VALUES (@userId, @rankMmr)
  ON CONFLICT(user_id) DO NOTHING
`)

const upsertUserProgressStatement = db.prepare(`
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
  )
  VALUES (
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

function safeParseJsonArray(rawValue) {
  try {
    const parsedValue = JSON.parse(rawValue ?? "[]")
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

function normalizeStoredProgress(progressRow) {
  if (!progressRow) return null

  return {
    userId: progressRow.userId,
    coins: Number(progressRow.coins) || 0,
    levelXp: Number(progressRow.levelXp) || 0,
    rankMmr: Number(progressRow.rankMmr) || 0,
    ownedItemIds: safeParseJsonArray(progressRow.ownedItemIds),
    equippedButtonSkinId: progressRow.equippedButtonSkinId || "skin_button",
    equippedArenaThemeId: progressRow.equippedArenaThemeId || "theme_default",
    equippedProfileImageId: progressRow.equippedProfileImageId || "profile_default",
    selectedModeId: progressRow.selectedModeId || "normal",
    roundHistory: safeParseJsonArray(progressRow.roundHistory),
    unlockedAchievementIds: safeParseJsonArray(progressRow.unlockedAchievementIds),
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

  return findUserById(result.lastInsertRowid)
}

export function updateUserPassword({ id, passwordHash }) {
  updatePasswordStatement.run({ id, passwordHash })
}

export function createDefaultUserProgress({ userId, rankMmr = 0 }) {
  insertDefaultUserProgressStatement.run({
    userId,
    rankMmr,
  })

  return findUserProgressByUserId(userId)
}

export function findUserProgressByUserId(userId) {
  return normalizeStoredProgress(findUserProgressByUserIdStatement.get(userId))
}

export function saveUserProgress({
  userId,
  coins = 0,
  levelXp = 0,
  rankMmr = 0,
  ownedItemIds = [],
  equippedButtonSkinId = "skin_button",
  equippedArenaThemeId = "theme_default",
  equippedProfileImageId = "profile_default",
  selectedModeId = "normal",
  roundHistory = [],
  unlockedAchievementIds = [],
}) {
  upsertUserProgressStatement.run({
    userId,
    coins,
    levelXp,
    rankMmr,
    ownedItemIds: JSON.stringify(ownedItemIds),
    equippedButtonSkinId,
    equippedArenaThemeId,
    equippedProfileImageId,
    selectedModeId,
    roundHistory: JSON.stringify(roundHistory),
    unlockedAchievementIds: JSON.stringify(unlockedAchievementIds),
  })

  return findUserProgressByUserId(userId)
}
