const BASE_XP_PER_HIT = 5
const XP_PER_BEST_STREAK_POINT = 3
const SCORE_XP_FACTOR = 0.2

const LEVEL_BASE_REQUIREMENT = 100
const LEVEL_REQUIREMENT_STEP = 50

function normalizeNumber(value) {
  return Number.isFinite(value) ? value : 0
}

function clampNonNegative(value) {
  return Math.max(0, normalizeNumber(value))
}

function parseAccuracyPercent(accuracy) {
  if (typeof accuracy === "number" && Number.isFinite(accuracy)) {
    return Math.max(0, Math.min(100, accuracy))
  }

  const parsedValue = Number.parseInt(String(accuracy).replace("%", ""), 10)
  return Number.isFinite(parsedValue) ? Math.max(0, Math.min(100, parsedValue)) : 0
}

export function getRequiredXpForLevel(level) {
  const normalizedLevel = Math.max(1, Math.floor(clampNonNegative(level)))
  return LEVEL_BASE_REQUIREMENT + (normalizedLevel - 1) * LEVEL_REQUIREMENT_STEP
}

export function calculateRoundXp({ hits = 0, misses = 0, bestStreak = 0, score = 0 }) {
  const normalizedHits = clampNonNegative(hits)
  const normalizedMisses = clampNonNegative(misses)
  const normalizedBestStreak = clampNonNegative(bestStreak)
  const normalizedScore = clampNonNegative(score)

  const totalAttempts = normalizedHits + normalizedMisses
  const accuracyPercent = totalAttempts > 0 ? (normalizedHits / totalAttempts) * 100 : 0
  const normalizedAccuracy = parseAccuracyPercent(accuracyPercent)

  let xp = 0
  xp += normalizedHits * BASE_XP_PER_HIT
  xp += normalizedBestStreak * XP_PER_BEST_STREAK_POINT
  xp += Math.floor(normalizedScore * SCORE_XP_FACTOR)

  if (normalizedAccuracy >= 90) xp += 25
  else if (normalizedAccuracy >= 75) xp += 10

  return Math.floor(clampNonNegative(xp))
}

export function getLevelProgress(totalXp = 0) {
  const normalizedTotalXp = Math.floor(clampNonNegative(totalXp))

  let level = 1
  let xpRemaining = normalizedTotalXp
  let requiredForCurrentLevel = getRequiredXpForLevel(level)

  while (xpRemaining >= requiredForCurrentLevel) {
    xpRemaining -= requiredForCurrentLevel
    level += 1
    requiredForCurrentLevel = getRequiredXpForLevel(level)
  }

  const xpIntoLevel = xpRemaining
  const xpToNextLevel = Math.max(0, requiredForCurrentLevel - xpIntoLevel)
  const progressPercent = requiredForCurrentLevel > 0
    ? Math.round((xpIntoLevel / requiredForCurrentLevel) * 100)
    : 0

  return {
    totalXp: normalizedTotalXp,
    level,
    xpIntoLevel,
    xpToNextLevel,
    xpForNextLevel: requiredForCurrentLevel,
    progressPercent,
  }
}
