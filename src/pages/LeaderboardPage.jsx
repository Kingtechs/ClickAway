import InfoStrip from "../components/InfoStrip.jsx"
import PlayerHoverCard from "../components/PlayerHoverCard.jsx"
import {
  LEADERBOARD_INSIGHTS,
  MOCK_LEADERBOARD,
} from "../features/leaderboard/leaderboardData.js"
import { buildPlayerLeaderboardStats } from "../utils/historyUtils.js"
import { isCompetitiveModeEntry } from "../utils/modeUtils.js"

function getCompetitiveHistory(roundHistory) {
  if (!Array.isArray(roundHistory)) return []
  return roundHistory.filter(isCompetitiveModeEntry)
}

function getLeaderboardRows(roundHistory, playerRankLabel, playerRankMmr, playerCoins, playerLevel) {
  const competitiveHistory = getCompetitiveHistory(roundHistory)
  const playerStats = buildPlayerLeaderboardStats(competitiveHistory)
  const mergedRows = [
    {
      username: "You",
      bestScore: playerStats.bestScore,
      bestStreak: playerStats.bestStreak,
      accuracy: playerStats.accuracy,
      rankLabel: playerRankLabel,
      mmr: playerRankMmr,
      coins: playerCoins,
      level: playerLevel,
    },
    ...MOCK_LEADERBOARD,
  ]

  return mergedRows
    .sort((firstRow, secondRow) => secondRow.bestScore - firstRow.bestScore)
    .slice(0, 5)
}

export default function LeaderboardPage({
  roundHistory = [],
  playerRankLabel = "Unranked",
  playerRankMmr = 0,
  playerCoins = 0,
  playerLevel = 1,
}) {
  const leaderboardRows = getLeaderboardRows(
    roundHistory,
    playerRankLabel,
    playerRankMmr,
    playerCoins,
    playerLevel,
  )

  return (
    <div className="pageCenter">
      <section className="card">
        <h1 className="cardTitle">Leaderboard</h1>
        <p className="muted">
          Ranked leaderboard. Only Ranked mode rounds affect rank/MMR placement.
        </p>

        <InfoStrip points={LEADERBOARD_INSIGHTS} />

        <table className="table helpTable leaderboardTable">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Tier</th>
              <th>MMR</th>
              <th>Best Score</th>
              <th>Best Streak</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardRows.map((player, index) => (
              <tr key={player.username} className="leaderboardTableRow">
                <td>{index + 1}</td>
                <td>
                  <div className="leaderboardEntryHoverWrap">
                    <span>{player.username}</span>
                    <div className="leaderboardEntryHoverCard">
                      <PlayerHoverCard
                        rankLabel={player.rankLabel}
                        rankMmr={player.mmr}
                        coins={player.coins}
                        level={player.level}
                        accuracy={player.accuracy}
                      />
                    </div>
                  </div>
                </td>
                <td>{player.rankLabel}</td>
                <td>{player.mmr}</td>
                <td>{player.bestScore}</td>
                <td>{player.bestStreak}</td>
                <td>{player.accuracy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
