import { useMemo } from "react"

import AchievementsCarousel from "../components/achievements/AchievementsCarousel.jsx"
import { evaluateAchievements } from "../game/achievements/evaluateAchievements.js"
import { formatAccuracy } from "../utils/gameMath.js"
import { isCompetitiveModeEntry } from "../utils/modeUtils.js"
import { getRankImageSrc } from "../utils/rankUtils.js"

function buildProfileStats(roundHistory = []) {
  const rows = Array.isArray(roundHistory) ? roundHistory : []

  let totalHits = 0
  let totalMisses = 0
  let bestScore = 0
  let bestStreak = 0
  let competitiveRounds = 0

  rows.forEach((round) => {
    const hits = Number(round.hits) || 0
    const misses = Number(round.misses) || 0
    const score = Number(round.score) || 0
    const streak = Number(round.bestStreak) || 0

    totalHits += hits
    totalMisses += misses
    bestScore = Math.max(bestScore, score)
    bestStreak = Math.max(bestStreak, streak)

    if (isCompetitiveModeEntry(round)) {
      competitiveRounds += 1
    }
  })

  return {
    totalRounds: rows.length,
    competitiveRounds,
    bestScore,
    bestStreak,
    overallAccuracy: formatAccuracy(totalHits, totalMisses),
  }
}

function buildCompetitiveInsights(roundHistory = []) {
  const competitiveRounds = (Array.isArray(roundHistory) ? roundHistory : [])
    .filter((round) => isCompetitiveModeEntry(round))
  const recentCompetitiveRounds = competitiveRounds.slice(0, 10)
  const recentRankDelta = recentCompetitiveRounds.reduce(
    (sum, round) => sum + (Number(round.rankDelta) || 0),
    0
  )
  const positiveDeltaRounds = recentCompetitiveRounds.filter(
    (round) => (Number(round.rankDelta) || 0) > 0
  ).length
  const recentWinRate = recentCompetitiveRounds.length > 0
    ? Math.round((positiveDeltaRounds / recentCompetitiveRounds.length) * 100)
    : 0

  return {
    recentSampleSize: recentCompetitiveRounds.length,
    recentRankDelta,
    recentWinRate,
  }
}

function formatNumber(value = 0) {
  return Number(value).toLocaleString()
}

function getProfileTagline({ totalRounds, overallAccuracy, bestStreak }) {
  const accuracyValue = Number.parseInt(String(overallAccuracy).replace("%", ""), 10) || 0

  if (totalRounds === 0) return "No rounds logged yet. Queue up and start your run."
  if (accuracyValue >= 85 && bestStreak >= 10) return "Precision specialist. Your tempo is locked in."
  if (accuracyValue >= 70) return "Strong fundamentals. Keep building consistency."
  return "Momentum is building. Focus accuracy and chain longer streaks."
}

function getPlayerTitle({ totalRounds, competitiveRounds, bestStreak, rankLabel = "" }) {
  if (totalRounds === 0) return "Arena Rookie"
  if (rankLabel.toLowerCase() === "gold") return "Gold Contender"
  if (competitiveRounds >= 25) return "Ranked Specialist"
  if (bestStreak >= 15) return "Combo Architect"
  if (totalRounds >= 60) return "Arena Veteran"
  return "Rising Contender"
}

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "P"
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

function getAvatarStyle(seedText = "") {
  const seed = [...String(seedText)].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const hue = seed % 360
  const nextHue = (hue + 36) % 360

  // A stable color per username makes the avatar feel like identity, not random decoration.
  return {
    background: `linear-gradient(145deg, hsl(${hue} 78% 62%), hsl(${nextHue} 74% 52%))`,
  }
}

function getRankToneClass(rankLabel = "", isUnranked = false) {
  if (isUnranked) return "rank-unranked"
  const normalizedRank = String(rankLabel).trim().toLowerCase()
  if (normalizedRank === "bronze" || normalizedRank === "silver" || normalizedRank === "gold") {
    return `rank-${normalizedRank}`
  }
  return "rank-unranked"
}

function StatCard({ label, value, tooltip = "", tone = "neutral", isFeatured = false }) {
  const ariaDescription = tooltip ? `${label}: ${value}. ${tooltip}` : `${label}: ${value}`

  return (
    <article
      className={`profileStatCard tone-${tone} ${isFeatured ? "isFeatured" : ""}`}
      data-tooltip={tooltip || undefined}
      aria-label={ariaDescription}
      tabIndex={0}
    >
      <p className="profileStatLabel">{label}</p>
      <p className="profileStatValue">{value}</p>
    </article>
  )
}

function StatsSection({ title, description, stats = [], gridClassName = "" }) {
  return (
    <section className="profileStatsSection" aria-label={title}>
      <header className="profileStatsSectionHeader">
        <h2 className="profileStatsSectionTitle">{title}</h2>
        <p className="profileStatsSectionDescription">{description}</p>
      </header>
      <div className={`profileStatsGrid ${gridClassName}`.trim()}>
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            tooltip={stat.tooltip}
            tone={stat.tone}
            isFeatured={stat.isFeatured}
          />
        ))}
      </div>
    </section>
  )
}

function formatSignedValue(value = 0) {
  const normalized = Number(value) || 0
  return `${normalized > 0 ? "+" : ""}${normalized}`
}

export default function ProfilePage({
  onLogout,
  playerName = "Player",
  coins = 0,
  levelProgress = {},
  rankProgress = {},
  roundHistory = [],
  equippedProfileImage = null,
  achievementStats = {},
  persistedAchievementIds = [],
}) {
  const evaluatedAchievements = useMemo(
    () => evaluateAchievements(achievementStats, {
      persistedUnlockedIds: persistedAchievementIds,
    }),
    [achievementStats, persistedAchievementIds]
  )
  const profileStats = buildProfileStats(roundHistory)
  const competitiveInsights = buildCompetitiveInsights(roundHistory)
  const rankLabel = rankProgress.tierLabel ?? "Unranked"
  const rankMmr = rankProgress.mmr ?? 0
  const rankIconSrc = getRankImageSrc(rankLabel)
  const rankToneClass = getRankToneClass(rankLabel, rankProgress.isUnranked)
  const levelValue = levelProgress.level ?? 1
  const xpIntoLevel = levelProgress.xpIntoLevel ?? 0
  const xpToNextLevel = levelProgress.xpToNextLevel ?? 0
  const xpForNextLevel = xpIntoLevel + xpToNextLevel
  const levelProgressPercent = levelProgress.progressPercent ?? 0
  const nextLevelValue = levelValue + 1
  const profileTagline = getProfileTagline(profileStats)
  const playerTitle = getPlayerTitle({
    totalRounds: profileStats.totalRounds,
    competitiveRounds: profileStats.competitiveRounds,
    bestStreak: profileStats.bestStreak,
    rankLabel,
  })
  const playerInitials = getInitials(playerName)
  const hasProfileImage = Boolean(equippedProfileImage?.imageSrc)
  const avatarStyle = hasProfileImage ? undefined : getAvatarStyle(playerName)
  const avatarClassName = `profileAvatar ${equippedProfileImage?.effectClass ?? ""} ${hasProfileImage ? "hasImage" : ""}`

  const playerProgressStats = [
    {
      label: "Coins",
      value: formatNumber(coins),
      tooltip: "Current coin balance available for shop purchases.",
      tone: "coins",
    },
    {
      label: "Level",
      value: `Lv ${levelValue}`,
      tooltip: "Your long-term account progression level.",
      tone: "level",
    },
    {
      label: "XP In Level",
      value: `${formatNumber(xpIntoLevel)} / ${formatNumber(xpForNextLevel)}`,
      tooltip: `XP progress in the current level. ${formatNumber(xpToNextLevel)} XP remaining.`,
      tone: "level",
    },
  ]

  const performanceStats = [
    {
      label: "Best Score",
      value: formatNumber(profileStats.bestScore),
      tooltip: "Highest score achieved in any single round.",
      tone: "score",
      isFeatured: true,
    },
    {
      label: "Best Streak",
      value: formatNumber(profileStats.bestStreak),
      tooltip: "Longest uninterrupted combo chain.",
      tone: "streak",
      isFeatured: true,
    },
  ]
  const combinedSummaryStats = [...playerProgressStats, ...performanceStats]

  return (
    <div className="pageCenter">
      <section className="card profileCard">
        <header className="profileHero">
          <div className="profileHeroMain">
            <p className="profileEyebrow">Player Identity</p>
            <h1 className="cardTitle profileTitle">Arena Profile</h1>

            <div className="profileIdentityRow">
              <div className={avatarClassName} style={avatarStyle} aria-hidden="true">
                {hasProfileImage ? (
                  <img className="profileAvatarImage" src={equippedProfileImage.imageSrc} alt="" />
                ) : (
                  playerInitials
                )}
              </div>
              <div className="profileIdentityText">
                <p className="profilePlayerName">{playerName}</p>
                <p className="profilePlayerTitle">{playerTitle}</p>
              </div>
            </div>

            <p className="profileLead">
              {profileTagline}
            </p>

            <div className="profileHeroChips">
              <span className="profileHeroChip tone-coins">Coins {formatNumber(coins)}</span>
              <span className="profileHeroChip tone-level">Level {levelValue}</span>
            </div>

            <div className="profileLevelProgress">
              <div className="profileLevelProgressTop">
                <div className="profileLevelProgressTitleGroup">
                  <span className="profileLevelProgressLabel">Progression Level</span>
                  <strong className="profileLevelProgressPercent">{levelProgressPercent}%</strong>
                </div>
                <span className="profileLevelProgressXpSummary">
                  {formatNumber(xpToNextLevel)} XP to Level {nextLevelValue}
                </span>
              </div>
              <div className="profileLevelProgressEnds" aria-hidden="true">
                <span>Lv {levelValue}</span>
                <span>Lv {nextLevelValue}</span>
              </div>
              <div className="profileLevelProgressTrack">
                <span
                  className="profileLevelProgressFill"
                  style={{ width: `${Math.max(0, Math.min(100, levelProgressPercent))}%` }}
                />
              </div>
            </div>
          </div>

          <aside className={`profileRankShowcase ${rankToneClass}`}>
            <div className="profileRankPrimary">
              <div className={`profileRankCrest ${rankProgress.isUnranked ? "isUnranked" : ""}`}>
                {rankIconSrc ? (
                  <img className="profileRankCrestImage" src={rankIconSrc} alt="" />
                ) : (
                  <span className="profileRankCrestFallback">?</span>
                )}
              </div>
              <div className="profileRankPrimaryText">
                <p className="profileRankLabel">Ranked Skill Rating</p>
                <h2 className="profileRankTitle">{rankLabel}</h2>
                <p className="profileRankMeta">
                  {rankProgress.isUnranked
                    ? "Play Ranked to place"
                    : `${formatNumber(rankMmr)} MMR`}
                </p>
              </div>
            </div>
            <div className="profileRankInsights" aria-label="Recent competitive trend">
              <article className="profileRankInsightItem">
                <span className="profileRankInsightLabel">Last 10 Delta</span>
                <strong className="profileRankInsightValue">
                  {formatSignedValue(competitiveInsights.recentRankDelta)}
                </strong>
              </article>
              <article className="profileRankInsightItem">
                <span className="profileRankInsightLabel">Positive Rounds</span>
                <strong className="profileRankInsightValue">
                  {competitiveInsights.recentSampleSize > 0
                    ? `${competitiveInsights.recentWinRate}%`
                    : "N/A"}
                </strong>
              </article>
              <article className="profileRankInsightItem">
                <span className="profileRankInsightLabel">Sample Size</span>
                <strong className="profileRankInsightValue">
                  {competitiveInsights.recentSampleSize}/10
                </strong>
              </article>
            </div>
            <div className="profileRankActionsDivider" />
            <button className="secondaryButton profileLogoutButton" type="button" onClick={onLogout}>
              Logout
            </button>
          </aside>
        </header>

        <div className="profileStatsSections">
          <StatsSection
            title="Player Summary"
            description="Progression and performance in one view."
            stats={combinedSummaryStats}
            gridClassName="isFiveColumns"
          />

          <section className="profileStatsSection profileAchievementsSection" aria-label="Achievements">
            <header className="profileStatsSectionHeader">
              <h2 className="profileStatsSectionTitle">Achievements</h2>
              <p className="profileStatsSectionDescription">
                Track unlock progress across level, consistency, and ranked play.
              </p>
            </header>

            <AchievementsCarousel achievements={evaluatedAchievements} />
          </section>
        </div>
      </section>
    </div>
  )
}
