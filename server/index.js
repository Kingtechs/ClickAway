import "dotenv/config"

import bcrypt from "bcryptjs"
import cors from "cors"
import express from "express"

import { extractBearerToken, signAuthToken, verifyAuthToken } from "./auth.js"
import {
  createDefaultUserProgress,
  createUser,
  findUserById,
  findUserProgressByUserId,
  findUserByUsername,
  saveUserProgress,
  updateUserPassword,
} from "./db.js"

const app = express()
const DEFAULT_SELECTED_MODE_ID = "normal"
const DEFAULT_BUTTON_SKIN_ID = "skin_button"
const DEFAULT_ARENA_THEME_ID = "theme_default"
const DEFAULT_PROFILE_IMAGE_ID = "profile_default"

const PORT = Number(process.env.PORT || 4000)
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173"
const JWT_SECRET = process.env.JWT_SECRET || ""
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ""

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET. Set it in your environment before starting the server.")
}

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: false,
}))
app.use(express.json())

function sanitizeUsername(username = "") {
  return String(username).trim()
}

function validateUsername(username) {
  if (!username) return "Username is required."
  if (username.length < 3) return "Username must be at least 3 characters."
  if (username.length > 32) return "Username must be 32 characters or less."
  return ""
}

function validatePassword(password = "") {
  if (!password) return "Password is required."
  if (password.length < 8) return "Password must be at least 8 characters."
  return ""
}

function buildDefaultProgress(rankMmr = 0) {
  return {
    coins: 0,
    levelXp: 0,
    rankMmr,
    ownedItemIds: [],
    equippedButtonSkinId: DEFAULT_BUTTON_SKIN_ID,
    equippedArenaThemeId: DEFAULT_ARENA_THEME_ID,
    equippedProfileImageId: DEFAULT_PROFILE_IMAGE_ID,
    selectedModeId: DEFAULT_SELECTED_MODE_ID,
    roundHistory: [],
    unlockedAchievementIds: [],
  }
}

function getUserProgressOrDefault(userId, rankMmr = 0) {
  return findUserProgressByUserId(userId) ?? buildDefaultProgress(rankMmr)
}

function validateProgressPayload(progress = {}) {
  if (!progress || typeof progress !== "object") {
    return "Progress payload is required."
  }

  return ""
}

function sanitizeProgressPayload(progress = {}) {
  return {
    coins: Math.max(0, Number(progress.coins) || 0),
    levelXp: Math.max(0, Number(progress.levelXp) || 0),
    rankMmr: Math.max(0, Number(progress.rankMmr) || 0),
    ownedItemIds: Array.isArray(progress.ownedItemIds)
      ? progress.ownedItemIds.filter((itemId) => typeof itemId === "string")
      : [],
    equippedButtonSkinId:
      typeof progress.equippedButtonSkinId === "string" && progress.equippedButtonSkinId
        ? progress.equippedButtonSkinId
        : DEFAULT_BUTTON_SKIN_ID,
    equippedArenaThemeId:
      typeof progress.equippedArenaThemeId === "string" && progress.equippedArenaThemeId
        ? progress.equippedArenaThemeId
        : DEFAULT_ARENA_THEME_ID,
    equippedProfileImageId:
      typeof progress.equippedProfileImageId === "string" && progress.equippedProfileImageId
        ? progress.equippedProfileImageId
        : DEFAULT_PROFILE_IMAGE_ID,
    selectedModeId:
      typeof progress.selectedModeId === "string" && progress.selectedModeId
        ? progress.selectedModeId
        : DEFAULT_SELECTED_MODE_ID,
    roundHistory: Array.isArray(progress.roundHistory) ? progress.roundHistory : [],
    unlockedAchievementIds: Array.isArray(progress.unlockedAchievementIds)
      ? progress.unlockedAchievementIds.filter((achievementId) => typeof achievementId === "string")
      : [],
  }
}

function buildAuthPayload(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
  }
}

function createAuthResponse(user) {
  return {
    token: signAuthToken(buildAuthPayload(user), JWT_SECRET),
    user: {
      username: user.username,
      role: user.role,
      progress: getUserProgressOrDefault(user.id),
    },
  }
}

function requireAuth(request, response, next) {
  const token = extractBearerToken(request.headers.authorization || "")
  if (!token) {
    response.status(401).json({ error: "Missing authentication token." })
    return
  }

  try {
    const payload = verifyAuthToken(token, JWT_SECRET)
    request.auth = {
      userId: Number(payload.sub),
      username: payload.username,
      role: payload.role,
    }
    next()
  } catch {
    response.status(401).json({ error: "Invalid or expired authentication token." })
  }
}

async function seedAdminAccount() {
  if (!ADMIN_PASSWORD) {
    console.log("Admin seed skipped: set ADMIN_PASSWORD in .env to create/update admin.")
    return
  }

  const existingAdmin = findUserByUsername(ADMIN_USERNAME)
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  if (!existingAdmin) {
    createUser({
      username: ADMIN_USERNAME,
      passwordHash,
      role: "admin",
    })
    console.log(`Admin account created for username "${ADMIN_USERNAME}".`)
    return
  }

  updateUserPassword({
    id: existingAdmin.id,
    passwordHash,
  })
  console.log(`Admin password refreshed for username "${existingAdmin.username}".`)
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true })
})

app.post("/api/auth/signup", async (request, response) => {
  const username = sanitizeUsername(request.body?.username)
  const password = String(request.body?.password || "")

  const usernameError = validateUsername(username)
  if (usernameError) {
    response.status(400).json({ error: usernameError })
    return
  }

  const passwordError = validatePassword(password)
  if (passwordError) {
    response.status(400).json({ error: passwordError })
    return
  }

  const existingUser = findUserByUsername(username)
  if (existingUser) {
    response.status(409).json({ error: "That username is already taken." })
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const createdUser = createUser({
    username,
    passwordHash,
    role: "player",
  })
  createDefaultUserProgress({ userId: createdUser.id })

  response.status(201).json(createAuthResponse(createdUser))
})

app.post("/api/auth/login", async (request, response) => {
  const username = sanitizeUsername(request.body?.username)
  const password = String(request.body?.password || "")

  if (!username || !password) {
    response.status(400).json({ error: "Username and password are required." })
    return
  }

  const user = findUserByUsername(username)
  if (!user) {
    response.status(401).json({ error: "Invalid username or password." })
    return
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash)
  if (!isValidPassword) {
    response.status(401).json({ error: "Invalid username or password." })
    return
  }

  response.json(createAuthResponse(user))
})

app.get("/api/auth/me", requireAuth, (request, response) => {
  const user = findUserById(request.auth.userId)
  if (!user) {
    response.status(401).json({ error: "Session is no longer valid." })
    return
  }

  response.json({
    user: {
      username: user.username,
      role: user.role,
      progress: getUserProgressOrDefault(user.id),
    },
  })
})

app.put("/api/progress", requireAuth, (request, response) => {
  const payloadError = validateProgressPayload(request.body?.progress)
  if (payloadError) {
    response.status(400).json({ error: payloadError })
    return
  }

  const user = findUserById(request.auth.userId)
  if (!user) {
    response.status(401).json({ error: "Session is no longer valid." })
    return
  }

  const savedProgress = saveUserProgress({
    userId: user.id,
    ...sanitizeProgressPayload(request.body.progress),
  })

  response.json({ progress: savedProgress })
})

async function startServer() {
  await seedAdminAccount()
  app.listen(PORT, () => {
    console.log(`Auth server listening on http://localhost:${PORT}`)
  })
}

startServer().catch((error) => {
  console.error("Server failed to start:", error)
  process.exit(1)
})
