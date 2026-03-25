import { POWERUPS } from "../../../constants/gameConstants.js"

const SEGMENT_COUNT = 5

export default function PowerupTray({
  powerupCharges,
  streak = 0,
  onUsePowerup,
  isPlaying = false,
}) {
  return (
    <section className="powerupPanel" aria-label="Power-ups">
      <div className="powerupTray">
        {POWERUPS.map((powerup) => {
          const charges = powerupCharges[powerup.id] ?? 0
          const isReady = charges > 0
          const isDisabled = !isPlaying || !isReady
          const hitsPerSegment = powerup.awardEvery / SEGMENT_COUNT
          const filledSegments = isReady
            ? SEGMENT_COUNT
            : Math.floor((streak % powerup.awardEvery) / hitsPerSegment)

          return (
            <button
              key={powerup.id}
              type="button"
              className={`powerupItem ${isReady ? "ready" : ""}`}
              onClick={() => onUsePowerup?.(powerup.id)}
              disabled={isDisabled}
              aria-label={`${powerup.label} (${charges} charges)`}
              title={powerup.description}
            >
              <div className="powerupTop">
                <strong className="powerupLabel">{powerup.label}</strong>
                <div className="powerupMeta">
                  {isReady ? <span className="powerupReadyCue">Ready</span> : null}
                  <div className="powerupCount">x{charges}</div>
                </div>
              </div>
              <div className="powerupBottom">
                <div className="powerupSlotBadge" aria-hidden="true">
                  {powerup.key}
                </div>
                <img src={powerup.icon} alt="" className="powerupIcon" />
                <div className="powerupSegmentBar">
                  {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
                    <div
                      key={index}
                      className={`powerupSegment ${index < filledSegments ? "filled" : ""}`}
                    />
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="powerupPanelFooter">
        <h2 className="powerupPanelTitle">Power Ups</h2>
        <p className="powerupPanelHint">Tap a card or use keys 1, 2, and 3.</p>
      </div>
    </section>
  )
}
