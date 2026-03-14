import { POWERUPS } from "../../../constants/gameConstants.js"

const SEGMENT_COUNT = 5

export default function PowerupTray({
  powerupCharges,
  streak = 0,
  isPlaying = false,
  onUsePowerup,
}) {
  return (
    <section className="powerupPanel" aria-label="Power-ups">
      <div className="powerupTray">
        {POWERUPS.map((powerup) => {
          const charges = powerupCharges[powerup.id] ?? 0
          const hitsPerSegment = powerup.awardEvery / SEGMENT_COUNT
          const filledSegments = charges > 0
            ? SEGMENT_COUNT
            : Math.floor((streak % powerup.awardEvery) / hitsPerSegment)
          const isReady = charges > 0

          return (
            <button
              key={powerup.id}
              type="button"
              className={`powerupItem ${isReady ? "ready" : ""}`}
              onClick={() => onUsePowerup?.(powerup.key)}
              disabled={!isPlaying || !isReady}
              aria-label={`${powerup.label}. ${charges} charges. Press ${powerup.key} to use.`}
            >
              <div className="powerupTop">
                <strong className="powerupLabel">{powerup.label}</strong>
                <div className="powerupCount">x{charges}</div>
              </div>
              <div className="powerupBottom">
                <img src={powerup.icon} alt="" className="powerupIcon" />
                <div className="powerupSegmentBar">
                  {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
                    <div
                      key={i}
                      className={`powerupSegment ${i < filledSegments ? "filled" : ""}`}
                    />
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <div className="powerupPanelFooter">
        <strong className="powerupPanelTitle">Power Ups</strong>
        <p className="powerupPanelHint">Tap a card or use keys 1, 2, and 3.</p>
      </div>
    </section>
  )
}
