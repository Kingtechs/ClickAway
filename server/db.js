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


