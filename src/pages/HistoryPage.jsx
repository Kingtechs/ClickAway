import { useEffect, useState } from "react"

import InfoStrip from "../components/InfoStrip.jsx"
import { HISTORY_INSIGHTS, MOCK_HISTORY } from "../features/history/historyData.js"
import { getModeLabelFromHistoryEntry } from "../utils/modeUtils.js"

function formatRankDelta(rankDelta = 0) {
  const normalizedDelta = Number.isFinite(rankDelta) ? rankDelta : 0
  return `${normalizedDelta > 0 ? "+" : ""}${normalizedDelta}`
}

function getHistoryRows(roundHistory) {
  if (Array.isArray(roundHistory) && roundHistory.length > 0) {
    return roundHistory
  }

  // Keep the page useful for first-time users before they have real matches logged.
  return MOCK_HISTORY
}

export default function HistoryPage({ roundHistory = [] }) {
  const historyRows = getHistoryRows(roundHistory)
  const [isMobileTable, setIsMobileTable] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(max-width: 1200px)").matches
  })

  useEffect(() => {
    if (typeof window === "undefined") return undefined

    const mediaQuery = window.matchMedia("(max-width: 1200px)")
    const handleChange = (event) => {
      setIsMobileTable(event.matches)
    }

    mediaQuery.addEventListener("change", handleChange)

    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return (
    <div className="pageCenter">
      <section className="card historyCard">
        <h1 className="cardTitle">Match History</h1>
        <p className="muted">
          Review rounds by mode and track coins, XP gain, and ranked rank changes.
        </p>

        <InfoStrip
          points={HISTORY_INSIGHTS}
          collapsible
          defaultCollapsed
          summary={HISTORY_INSIGHTS[0]}
        />

        {isMobileTable ? (
          <div className="historyCards">
            {historyRows.map((round) => (
              <article key={round.id} className="historyEntryCard">
                <div className="historyEntryRow">
                  <span className="historyEntryLabel">Played</span>
                  <span className="historyEntryValue">{round.playedAt}</span>
                </div>
                <div className="historyEntryRow">
                  <span className="historyEntryLabel">Mode</span>
                  <span className="historyEntryValue">{getModeLabelFromHistoryEntry(round)}</span>
                </div>
                <div className="historyEntryRow">
                  <span className="historyEntryLabel">Score</span>
                  <span className="historyEntryValue">{round.score}</span>
                </div>
                <div className="historyEntryRow">
                  <span className="historyEntryLabel">Hits</span>
                  <span className="historyEntryValue">{round.hits}</span>
                </div>
                <div className="historyEntryRow">
                  <span className="historyEntryLabel">Misses</span>
                  <span className="historyEntryValue">{round.misses}</span>
                </div>
                <div className="historyEntryRow">
                  <span className="historyEntryLabel">Accuracy</span>
                  <span className="historyEntryValue">{round.accuracy}</span>
                </div>
                <div className="historyEntryRow">
                  <span className="historyEntryLabel">Coins Earned</span>
                  <span className="historyEntryValue">{round.coinsEarned}</span>
                </div>
                <div className="historyEntryRow">
                  <span className="historyEntryLabel">XP</span>
                  <span className="historyEntryValue">{round.xpEarned ?? 0}</span>
                </div>
                <div className="historyEntryRow">
                  <span className="historyEntryLabel">Rank +/-</span>
                  <span className="historyEntryValue">{formatRankDelta(round.rankDelta)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="historyTableWrap">
            <table className="table helpTable historyTable">
              <thead>
                <tr>
                  <th>Played</th>
                  <th>Mode</th>
                  <th>Score</th>
                  <th>Hits</th>
                  <th>Misses</th>
                  <th>Accuracy</th>
                  <th>Coins Earned</th>
                  <th>XP</th>
                  <th>Rank +/-</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((round) => (
                  <tr key={round.id}>
                    <td>{round.playedAt}</td>
                    <td>{getModeLabelFromHistoryEntry(round)}</td>
                    <td>{round.score}</td>
                    <td>{round.hits}</td>
                    <td>{round.misses}</td>
                    <td>{round.accuracy}</td>
                    <td>{round.coinsEarned}</td>
                    <td>{round.xpEarned ?? 0}</td>
                    <td>{formatRankDelta(round.rankDelta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
