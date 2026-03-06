import { isCompetitiveModeEntry } from "../../utils/modeUtils.js"
import { ACHIEVEMENTS } from "./achievementsList.js"

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function toNonNegativeNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : null
}

function normalizeTarget(targetValue) {
  const numericTarget = Number(targetValue)
  if (!Number.isFinite(numericTarget) || numericTarget <= 0) {
    return 1
  }
  return numericTarget
}

function getAchievementCurrentValue(achievement, playerStats) {
  if (typeof achievement.computeCurrent === "function") {
    return toNonNegativeNumber(achievement.computeCurrent(playerStats))
  }
  return toNonNegativeNumber(playerStats?.[achievement.metricKey])
}

function getProgressText(current, target, isProgressAvailable) {
  if (!isProgressAvailable) return "Progress unavailable"
  return `${Math.min(current, target).toLocaleString()} / ${target.toLocaleString()}`
}

/**
 * Builds a normalized stats snapshot used by achievements.
 */
export function buildAchievementStats({
  levelProgress = {},
  roundHistory = [],
  coins = 0,
} = {}) {
  const rounds = Array.isArray(roundHistory) ? roundHistory : []
  let totalHits = 0
  let totalMisses = 0
  let bestScore = 0
  let bestStreak = 0
  let competitiveRounds = 0
  let bestCleanRunHits = 0
  let totalCoinsEarned = 0
  let hasAccuracyData = false
  let hasCoinsData = false

  rounds.forEach((round) => {
    const hits = toNonNegativeNumber(round?.hits)
    const misses = toNonNegativeNumber(round?.misses)
    const score = toNonNegativeNumber(round?.score)
    const streak = toNonNegativeNumber(round?.bestStreak)
    const coinsEarned = toNonNegativeNumber(round?.coinsEarned)

    if (hits !== null && misses !== null) {
      hasAccuracyData = true
      totalHits += hits
      totalMisses += misses

      if (misses === 0) {
        bestCleanRunHits = Math.max(bestCleanRunHits, hits)
      }
    }

    if (score !== null) {
      bestScore = Math.max(bestScore, score)
    }

    if (streak !== null) {
      bestStreak = Math.max(bestStreak, streak)
    }

    if (coinsEarned !== null) {
      hasCoinsData = true
      totalCoinsEarned += coinsEarned
    }

    if (isCompetitiveModeEntry(round)) {
      competitiveRounds += 1
    }
  })

  const totalAttempts = totalHits + totalMisses
  const overallAccuracyPercent = hasAccuracyData
    ? (totalAttempts > 0 ? Math.round((totalHits / totalAttempts) * 100) : 0)
    : null
  const normalizedLevel = toNonNegativeNumber(levelProgress?.level) ?? 1

  return {
    level: Math.max(1, normalizedLevel),
    currentCoins: toNonNegativeNumber(coins) ?? 0,
    totalRounds: rounds.length,
    competitiveRounds,
    bestScore,
    bestStreak,
    overallAccuracyPercent,
    bestCleanRunHits: hasAccuracyData ? bestCleanRunHits : null,
    totalCoinsEarned: hasCoinsData ? totalCoinsEarned : null,
  }
}

/**
 * Enriches achievement definitions with computed progress.
 */
export function evaluateAchievements(playerStats = {}, options = {}) {
  const persistedUnlockedIds = new Set(
    Array.isArray(options.persistedUnlockedIds)
      ? options.persistedUnlockedIds.filter((id) => typeof id === "string")
      : []
  )

  return ACHIEVEMENTS.map((achievement) => {
    const target = normalizeTarget(achievement.targetValue)
    const currentValue = getAchievementCurrentValue(achievement, playerStats)
    const isProgressAvailable = currentValue !== null
    const baseRatio = isProgressAvailable
      ? clamp(currentValue / target, 0, 1)
      : 0
    const basePercent = isProgressAvailable ? Math.floor(baseRatio * 100) : 0
    const isUnlockedByProgress = isProgressAvailable && currentValue >= target
    const isUnlocked = isUnlockedByProgress || persistedUnlockedIds.has(achievement.id)
    const percent = isUnlocked ? 100 : basePercent
    const progressRatio = isUnlocked ? 1 : baseRatio
    const current = isProgressAvailable ? currentValue : 0

    return {
      ...achievement,
      current,
      target,
      percent,
      progressRatio,
      isUnlocked,
      isProgressAvailable,
      progressText: getProgressText(current, target, isProgressAvailable),
      percentText: isProgressAvailable
        ? (isUnlocked ? "Unlocked" : `${percent}%`)
        : "Progress unavailable",
    }
  })
}

export function getUnlockedAchievementIds(evaluatedAchievements = []) {
  return evaluatedAchievements
    .filter((achievement) => achievement?.isUnlocked)
    .map((achievement) => achievement.id)
}

