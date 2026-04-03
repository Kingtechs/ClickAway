import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import InfoStrip from "../components/InfoStrip.jsx"
import PlayerHoverCard from "../components/PlayerHoverCard.jsx"
import TierBadge from "../components/TierBadge.jsx"
import { LEADERBOARD_INSIGHTS } from "../features/leaderboard/leaderboardData.js"
import { fetchLeaderboard } from "../services/api.js"
import { formatPercent, normalizePercentValue } from "../utils/gameMath.js"
import { getLevelProgress } from "../utils/progressionUtils.js"
import { getRankProgressWithPlacement } from "../utils/rankUtils.js"

const SORTABLE_COLUMNS = [
  { key: "mmr", label: "MMR" },
  { key: "bestScore", label: "Best Score" },
  { key: "bestStreak", label: "Best Streak" },
  { key: "accuracyPercent", label: "Accuracy" },
]

const DEFAULT_SORT = { key: "mmr", direction: "desc" }

function formatNumericValue(value) {
  const normalizedValue = Number(value)
  if (!Number.isFinite(normalizedValue)) return "0"
  return Math.max(0, normalizedValue).toLocaleString()
}

function getSortableValue(player, sortKey) {
  const numericValue = Number(player?.[sortKey])
  return Number.isFinite(numericValue) ? numericValue : 0
}

function isCurrentUserRow(player, currentUserId, currentUsername) {
  const normalizedCurrentUserId = String(currentUserId ?? "").trim()
  const normalizedRowUserId = String(player?.userId ?? "").trim()

  if (normalizedCurrentUserId && normalizedCurrentUserId === normalizedRowUserId) {
    return true
  }

  const normalizedCurrentUsername = String(currentUsername ?? "").trim().toLowerCase()
  const normalizedRowUsername = String(player?.username ?? "").trim().toLowerCase()
  return Boolean(
    !normalizedCurrentUserId &&
    normalizedCurrentUsername &&
    normalizedCurrentUsername === normalizedRowUsername
  )
}

function normalizeLeaderboardRow(row = {}, rowIndex = 0) {
  const rankedRounds = Math.max(0, Number(row.rankedRounds) || 0)
  const mmr = Math.max(0, Number(row.mmr) || 0)
  const accuracyPercent = normalizePercentValue(row.accuracyPercent)
  const levelXp = Math.max(0, Number(row.levelXp) || 0)
  const level = getLevelProgress(levelXp).level
  const rankProgress = getRankProgressWithPlacement(mmr, rankedRounds > 0)

  return {
    rank: Math.max(1, Number(row.rank) || (rowIndex + 1)),
    rowIndex,
    userId: String(row.userId ?? ""),
    username: String(row.username || "Player"),
    mmr,
    coins: Math.max(0, Number(row.coins) || 0),
    level,
    bestScore: Math.max(0, Number(row.bestScore) || 0),
    bestStreak: Math.max(0, Number(row.bestStreak) || 0),
    accuracyPercent,
    rankLabel: rankProgress.tierLabel,
  }
}

async function requestLeaderboardRows(authToken) {
  const response = await fetchLeaderboard(authToken)
  return (Array.isArray(response?.rows) ? response.rows : []).map(normalizeLeaderboardRow)
}

function SortableHeader({ label, columnKey, sortConfig, onSort }) {
  const isActive = sortConfig.key === columnKey
  const ariaSort = isActive
    ? (sortConfig.direction === "asc" ? "ascending" : "descending")
    : "none"

  return (
    <th className="leaderboardNumeric" aria-sort={ariaSort}>
      <button
        type="button"
        className={`leaderboardSortButton${isActive ? " isActive" : ""}`}
        onClick={() => onSort(columnKey)}
      >
        <span>{label}</span>
        {isActive ? (
          <span className="leaderboardSortIndicator" aria-hidden="true">
            <span className={sortConfig.direction === "asc" ? "isActive" : ""}>{"\u25B2"}</span>
            <span className={sortConfig.direction === "desc" ? "isActive" : ""}>{"\u25BC"}</span>
          </span>
        ) : null}
      </button>
    </th>
  )
}

function RankDisplay({ rank = 0 }) {
  const normalizedRank = Math.max(1, Number(rank) || 1)
  const isTopThree = normalizedRank <= 3

  if (!isTopThree) {
    return <span className="leaderboardRankText">{formatNumericValue(normalizedRank)}</span>
  }

  return (
    <span className={`leaderboardRankBadge is-rank${normalizedRank}`}>
      {normalizedRank}
    </span>
  )
}

export default function LeaderboardPage({
  authToken = "",
  currentUserId = "",
  currentUsername = "",
}) {
  const navigate = useNavigate()
  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT)
  const [leaderboardRows, setLeaderboardRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const loadLeaderboard = useCallback(async () => {
    if (!authToken) {
      setLeaderboardRows([])
      setLoadError("Missing authentication token.")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError("")

    try {
      setLeaderboardRows(await requestLeaderboardRows(authToken))
    } catch (error) {
      setLeaderboardRows([])
      setLoadError(error.message || "Unable to load leaderboard.")
    } finally {
      setIsLoading(false)
    }
  }, [authToken])

  useEffect(() => {
    let isCancelled = false

    async function syncLeaderboard() {
      if (!authToken) {
        if (!isCancelled) {
          setLeaderboardRows([])
          setLoadError("Missing authentication token.")
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setLoadError("")

      try {
        const rows = await requestLeaderboardRows(authToken)
        if (isCancelled) return
        setLeaderboardRows(rows)
      } catch (error) {
        if (isCancelled) return
        setLeaderboardRows([])
        setLoadError(error.message || "Unable to load leaderboard.")
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    syncLeaderboard()

    return () => {
      isCancelled = true
    }
  }, [authToken])

  const sortedRows = useMemo(() => {
    return [...leaderboardRows].sort((firstRow, secondRow) => {
      const firstValue = getSortableValue(firstRow, sortConfig.key)
      const secondValue = getSortableValue(secondRow, sortConfig.key)
      const directionMultiplier = sortConfig.direction === "asc" ? 1 : -1

      if (firstValue !== secondValue) {
        return (firstValue - secondValue) * directionMultiplier
      }

      return firstRow.rowIndex - secondRow.rowIndex
    })
  }, [leaderboardRows, sortConfig])

  function handleSort(columnKey) {
    setSortConfig((currentSort) => {
      if (currentSort.key === columnKey) {
        return {
          ...currentSort,
          direction: currentSort.direction === "desc" ? "asc" : "desc",
        }
      }

      return { key: columnKey, direction: "desc" }
    })
  }

  function handleProfileOpen(isCurrentUser) {
    if (!isCurrentUser) return
    navigate("/profile")
  }

  function handleRowKeyDown(event, isCurrentUser) {
    if (!isCurrentUser) return
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    handleProfileOpen(isCurrentUser)
  }

  return (
    <div className="pageCenter">
      <section className="card">
        <h1 className="cardTitle">Leaderboard</h1>
        <p className="muted">
          View your current rank/MMR placement.
        </p>

        <InfoStrip
          points={LEADERBOARD_INSIGHTS}
          collapsible
          defaultCollapsed
        />

        {isLoading ? (
          <div className="leaderboardStatusCard" role="status" aria-live="polite">
            <p className="leaderboardStatusTitle">Loading leaderboard...</p>
            <p className="muted">Fetching ranked standings from the server.</p>
          </div>
        ) : null}

        {!isLoading && loadError ? (
          <div className="leaderboardStatusCard" role="alert">
            <p className="leaderboardStatusTitle">Leaderboard unavailable</p>
            <p className="muted">{loadError}</p>
            <button type="button" className="leaderboardRetryButton" onClick={loadLeaderboard}>
              Retry
            </button>
          </div>
        ) : null}

        {!isLoading && !loadError && sortedRows.length === 0 ? (
          <div className="leaderboardStatusCard" role="status" aria-live="polite">
            <p className="leaderboardStatusTitle">No ranked players yet.</p>
            <p className="muted">Play a Ranked round to start populating the ladder.</p>
          </div>
        ) : null}

        {!isLoading && !loadError && sortedRows.length > 0 ? (
          <table className="table helpTable leaderboardTable">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Tier</th>
                {SORTABLE_COLUMNS.map((column) => (
                  <SortableHeader
                    key={column.key}
                    label={column.label}
                    columnKey={column.key}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((player) => {
                const isCurrentUser = isCurrentUserRow(player, currentUserId, currentUsername)

                return (
                  <tr
                    key={`${player.userId}-${player.rank}`}
                    className={`leaderboardTableRow${isCurrentUser ? " isCurrentUser isInteractive" : ""}`}
                    tabIndex={isCurrentUser ? 0 : undefined}
                    onClick={isCurrentUser ? () => handleProfileOpen(true) : undefined}
                    onKeyDown={isCurrentUser
                      ? (event) => handleRowKeyDown(event, true)
                      : undefined}
                    aria-label={isCurrentUser ? `Open ${player.username} profile` : undefined}
                  >
                    <td><RankDisplay rank={player.rank} /></td>
                    <td>
                      <div className="leaderboardEntryHoverWrap">
                        <span className="leaderboardPlayerName">
                          {player.username}
                          {isCurrentUser ? <span className="leaderboardYouBadge">YOU</span> : null}
                        </span>
                        <div className="leaderboardEntryHoverCard">
                          <PlayerHoverCard
                            rankLabel={player.rankLabel}
                            rankMmr={player.mmr}
                            coins={player.coins}
                            level={player.level}
                            accuracyPercent={player.accuracyPercent}
                          />
                        </div>
                      </div>
                    </td>
                    <td><TierBadge tierLabel={player.rankLabel} className="leaderboardTierBadge" /></td>
                    <td className="leaderboardNumeric">{formatNumericValue(player.mmr)}</td>
                    <td className="leaderboardNumeric">{formatNumericValue(player.bestScore)}</td>
                    <td className="leaderboardNumeric">{formatNumericValue(player.bestStreak)}</td>
                    <td className="leaderboardNumeric">
                      {formatPercent(player.accuracyPercent)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  )
}
