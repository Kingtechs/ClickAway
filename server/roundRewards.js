const DIFFICULTY_IDS = { EASY: "easy", NORMAL: "normal", HARD: "hard" }
const PROGRESSION_MODE = { PRACTICE: "practice", NON_RANKED: "non_ranked", RANKED: "ranked" }

const DIFFICULTIES_BY_ID = {
  easy: { allowsCoinRewards: false, allowsLevelProgression: false, allowsRankProgression: false, coinMultiplier: 1, progressionMode: PROGRESSION_MODE.PRACTICE },
  normal: { allowsCoinRewards: true, allowsLevelProgression: true, allowsRankProgression: false, coinMultiplier: 1, progressionMode: PROGRESSION_MODE.NON_RANKED },
  hard: { allowsCoinRewards: true, allowsLevelProgression: true, allowsRankProgression: true, coinMultiplier: 1.5, progressionMode: PROGRESSION_MODE.RANKED },
}

function clamp(value) {
  const n = Number.isFinite(value) ? value : 0
  return Math.max(0, n)
}

function accuracyPercent(hits, misses) {
  const total = hits + misses
  return total > 0 ? (hits / total) * 100 : 0
}

export function calculateRewards({ modeId, hits, misses, score, bestStreak }) {
  const mode = DIFFICULTIES_BY_ID[modeId] ?? DIFFICULTIES_BY_ID.normal
  const h = clamp(hits)
  const m = clamp(misses)
  const s = clamp(score)
  const bs = clamp(bestStreak)
  const acc = accuracyPercent(h, m)

  // Coins
  const earnedCoins = mode.allowsCoinRewards
    ? Math.max(0, Math.floor(h * mode.coinMultiplier))
    : 0

  // XP
  let xp = 0
  if (mode.allowsLevelProgression) {
    xp += h * 5
    xp += bs * 3
    xp += Math.floor(s * 0.2)
    if (acc >= 90) xp += 25
    else if (acc >= 75) xp += 10
    xp = Math.floor(Math.max(0, xp))
  }

  // MMR delta
  let rankDelta = 0
  if (mode.allowsRankProgression) {
    rankDelta += Math.floor(s / 40)
    rankDelta += Math.floor(bs / 3)
    if (acc >= 99) rankDelta += 8
    else if (acc >= 96) rankDelta += 6
    else if (acc >= 93) rankDelta += 3
    else if (acc >= 90) rankDelta += 1
    else if (acc >= 85) rankDelta -= 3
    else if (acc >= 80) rankDelta -= 6
    else rankDelta -= 10
    if (m >= 18) rankDelta -= 10
    if (h <= 8) rankDelta -= 12
    rankDelta = Math.max(-25, Math.min(35, Math.floor(rankDelta)))
  }

  return {
    earnedCoins,
    earnedXp: xp,
    rankDelta,
    progressionMode: mode.progressionMode,
  }
}
