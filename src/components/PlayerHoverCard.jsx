import { getRankImageSrc } from "../utils/rankUtils.js"

function HoverStatRow({ label, value, tone = "default" }) {
  return (
    <div className={`profileHoverStatRow tone-${tone}`}>
      <span className="profileHoverStatLabel">{label}</span>
      <strong className="profileHoverStatValue">{value}</strong>
    </div>
  )
}

function CompetitiveHoverRank({ rankLabel, rankMmr }) {
  const displayLabel = rankLabel || "Unranked"
  const displayMmr = Number.isFinite(rankMmr) ? Math.max(0, rankMmr) : 0
  const isUnranked = displayLabel.toLowerCase() === "unranked"
  const rankImageSrc = getRankImageSrc(displayLabel)
  const mmrText = isUnranked ? "Place in Ranked" : `${displayMmr.toLocaleString()} MMR`

  return (
    <section className="profileHoverRankBlock" aria-label={`Ranked rating ${displayLabel} ${displayMmr} MMR`}>
      {rankImageSrc ? (
        <span className="profileHoverRankIconSlot" aria-hidden="true">
          <img className="profileHoverRankIcon" src={rankImageSrc} alt="" />
        </span>
      ) : null}
      <div className="profileHoverRankText">
        <span className="profileHoverRankLabel">Ranked Rating</span>
        <strong className="profileHoverRankValue">{displayLabel}</strong>
        <span className="profileHoverRankMeta">{mmrText}</span>
      </div>
    </section>
  )
}

export default function PlayerHoverCard({ rankLabel = "Unranked", rankMmr = 0, coins = 0, level = 1 }) {
  const formattedCoins = Number.isFinite(coins) ? coins.toLocaleString() : "0"
  const normalizedLevel = Number.isFinite(level) ? Math.max(1, level) : 1

  return (
    <div className="profileHoverCard">
      <CompetitiveHoverRank rankLabel={rankLabel} rankMmr={rankMmr} />
      <div className="profileHoverStats" aria-label="Player quick stats">
        <HoverStatRow label="Coin Vault" value={formattedCoins} tone="coins" />
        <HoverStatRow label="XP Level" value={`Lv ${normalizedLevel}`} tone="level" />
      </div>
    </div>
  )
}
