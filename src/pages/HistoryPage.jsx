import { Link } from "react-router-dom"

import InfoStrip from "../components/InfoStrip.jsx"
import { HISTORY_INSIGHTS, HISTORY_PREVIEW_FIELDS } from "../features/history/historyData.js"
import { formatPercent } from "../utils/gameMath.js"
import { formatPlayedAtLabel } from "../utils/historyUtils.js"
import { getModeLabelFromHistoryEntry } from "../utils/modeUtils.js"

function formatRankDelta(rankDelta = 0) {
  const normalizedDelta = Number.isFinite(rankDelta) ? rankDelta : 0
  return `${normalizedDelta > 0 ? "+" : ""}${normalizedDelta}`
}

function getPlayedAtLabel(round = {}) {
  const playedAtDate = new Date(round.playedAtIso || Date.now())
  return Number.isNaN(playedAtDate.getTime())
    ? "\u2014"
    : formatPlayedAtLabel(playedAtDate)
}

export default function HistoryPage({ roundHistory = [] }) {
  const historyRows = Array.isArray(roundHistory) ? roundHistory : []
  const hasHistory = historyRows.length > 0

  return (
    <div className="pageCenter">
      <section className="card">
        <h1 className="cardTitle">Match History</h1>
        <p className="muted">
          Review rounds by mode and track coins, XP gain, and ranked rank changes.
        </p>

        <InfoStrip
          points={HISTORY_INSIGHTS}
          collapsible
          defaultCollapsed
        />

        {!hasHistory ? (
          <section className="historyEmptyState" role="status" aria-live="polite">
            <p className="historyEmptyEyebrow">No rounds logged</p>
            <h2 className="historyEmptyTitle">Your match history will appear here after your first run.</h2>
            <p className="historyEmptyLead">
              Finish a round to start tracking score, accuracy, rewards, and ranked movement over time.
            </p>
            <div className="historyEmptyActions">
              <Link className="primaryButton" to="/game">
                Play a Round
              </Link>
            </div>
            <div className="historyPreviewWrap" aria-label="History fields preview">
              <p className="historyPreviewTitle">What gets tracked</p>
              <div className="historyPreviewGrid">
                {HISTORY_PREVIEW_FIELDS.map((field) => (
                  <span key={field} className="historyPreviewChip">
                    {field}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <table className="table helpTable">
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
                  <td>{getPlayedAtLabel(round)}</td>
                  <td>{getModeLabelFromHistoryEntry(round)}</td>
                  <td>{round.score}</td>
                  <td>{round.hits}</td>
                  <td>{round.misses}</td>
                  <td>{formatPercent(round.accuracyPercent)}</td>
                  <td>{round.coinsEarned}</td>
                  <td>{round.xpEarned ?? 0}</td>
                  <td>{formatRankDelta(round.rankDelta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
