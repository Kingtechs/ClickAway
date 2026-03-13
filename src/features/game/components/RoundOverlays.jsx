import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { getModeLabelFromModeConfig } from "../../../utils/modeUtils.js"
import { getRankTierFromMmr } from "../../../utils/rankUtils.js"

const MODE_ORDER = ["Practice", "Casual", "Ranked"]
const MODE_COPY = [
  {
    name: "Practice",
    description: "Train mechanics. No rewards.",
    badge: "Training",
    glyph: "P",
  },
  {
    name: "Casual",
    description: "Earn XP + coins. No rank.",
    badge: "Standard",
    glyph: "C",
  },
  {
    name: "Ranked",
    description: "Earn XP + coins + rank. Harder penalties.",
    badge: "Ranked",
    glyph: "R",
  },
]
const MODE_COPY_BY_NAME = MODE_COPY.reduce((accumulator, mode) => {
  accumulator[mode.name] = mode
  return accumulator
}, {})

function getShrinkPaceLabel(shrinkFactor) {
  if (shrinkFactor >= 0.98) return "Relaxed"
  return "Aggressive"
}

function getModeFooterText(mode) {
  if (!mode) return ""
  const bonusPercent = Math.round((mode.coinMultiplier - 1) * 100)
  const coinBonusText = bonusPercent > 0 ? `Coin bonus +${bonusPercent}%` : "Coin bonus none"
  return `Combo every ${mode.comboStep} hits, ${coinBonusText}`
}

function toModeSlide(mode) {
  if (!mode) return null
  const name = getModeLabelFromModeConfig(mode)
  const copy = MODE_COPY_BY_NAME[name]
  const round = mode.isTimedRound === false ? "No limit" : `${mode.durationSeconds}s`
  const miss = mode.missPenalty > 0 ? `-${mode.missPenalty}` : "None"

  return {
    id: mode.id,
    name,
    tone: name.toLowerCase(),
    badge: copy?.badge ?? "Mode",
    glyph: copy?.glyph ?? name.charAt(0),
    description: copy?.description ?? mode.playerHint,
    round,
    miss,
    shrink: getShrinkPaceLabel(mode.shrinkFactor),
    footer: getModeFooterText(mode),
  }
}

function getGameOverTone({ hits, misses, accuracy, bestStreak }) {
  const accuracyValue = Number.parseInt(String(accuracy).replace("%", ""), 10)
  const normalizedAccuracy = Number.isFinite(accuracyValue) ? accuracyValue : 0

  if (normalizedAccuracy >= 90 && bestStreak >= 10) return "elite"
  if (hits >= misses && normalizedAccuracy >= 65) return "steady"
  return "recovery"
}

function ModePreviewContent({ mode, animationClass = "" }) {
  if (!mode) return null

  return (
    <article className={`modeCard modeCard-${mode.tone} ${animationClass}`}>
      <header className="modeCardHeader">
        <div className="modeCardTitleGroup">
          <span className="modeCardGlyph" aria-hidden="true">{mode.glyph}</span>
          <h3 className="modeCardTitle">{mode.name}</h3>
        </div>
        <span className="modeCardBadge">{mode.badge}</span>
      </header>
      <p className="modeCardDescription">{mode.description}</p>
      <div className="modeCardStats">
        <div className="modeCardStat">
          <span className="modeCardStatLabel">Round</span>
          <strong className="modeCardStatValue">{mode.round}</strong>
        </div>
        <div className="modeCardStat">
          <span className="modeCardStatLabel">Miss</span>
          <strong className="modeCardStatValue">{mode.miss}</strong>
        </div>
        <div className="modeCardStat">
          <span className="modeCardStatLabel">Shrink</span>
          <strong className="modeCardStatValue">{mode.shrink}</strong>
        </div>
      </div>
      {mode.footer ? <p className="modeCardFooter">{mode.footer}</p> : null}
    </article>
  )
}

function formatSignedValue(value = 0) {
  const normalized = Number(value) || 0
  return `${normalized > 0 ? "+" : ""}${normalized}`
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ))

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    function handleChange(event) {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return prefersReducedMotion
}

function easeOutCubic(progress) {
  return 1 - ((1 - progress) ** 3)
}

function useCountUpNumber(targetValue, { durationMs, delayMs = 0, disabled = false }) {
  const [displayValue, setDisplayValue] = useState(targetValue)

  useEffect(() => {
    if (disabled) {
      return undefined
    }

    const absoluteTarget = Math.abs(targetValue)
    let animationFrameId = 0
    let timeoutId = 0
    const direction = targetValue >= 0 ? 1 : -1

    // We use RAF so animation pace stays smooth across different refresh rates.
    function startAnimation() {
      setDisplayValue(0)
      const startTimestamp = performance.now()

      function animateFrame(now) {
        const elapsed = now - startTimestamp
        const progress = Math.min(1, elapsed / durationMs)
        const easedProgress = easeOutCubic(progress)
        const nextValue = Math.round(absoluteTarget * easedProgress) * direction
        setDisplayValue(nextValue)

        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(animateFrame)
        } else {
          setDisplayValue(targetValue)
        }
      }

      animationFrameId = window.requestAnimationFrame(animateFrame)
    }

    timeoutId = window.setTimeout(startAnimation, delayMs)

    return () => {
      window.clearTimeout(timeoutId)
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [delayMs, disabled, durationMs, targetValue])

  return displayValue
}

function getModeRewardsSummary({
  allowsCoinRewards,
  allowsLevelProgression,
  allowsRankProgression,
}) {
  if (!allowsCoinRewards && !allowsLevelProgression && !allowsRankProgression) {
    return "Rewards: None (aim practice)"
  }

  if (allowsRankProgression) {
    return "Rewards: XP, Coins, Rank"
  }

  return "Rewards: XP, Coins"
}

function GameOverSection({ title, rows = [], panelType = "neutral" }) {
  if (!rows.length) return null

  return (
    <section className={`gameOverSection panel-${panelType}`} aria-label={title}>
      <h3 className="gameOverSectionTitle">{title}</h3>
      <div className="gameOverList">
        {rows.map((row) => (
          <article
            key={row.label}
            className={`gameOverListRow ${row.group ? `group-${row.group}` : ""}`}
          >
            <span className="gameOverListLabel">{row.label}</span>
            <strong className={`gameOverListValue ${row.highlight ? "isReward" : ""}`}>
              {row.value}
            </strong>
          </article>
        ))}
      </div>
    </section>
  )
}

export function ReadyOverlay({
  onStart,
  modes = [],
  selectedModeId,
  onSelectMode,
  canChangeMode = true,
  onClose,
}) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const modeSlides = useMemo(() => {
    const orderedModes = MODE_ORDER.map((modeName) =>
      modes.find((mode) => getModeLabelFromModeConfig(mode) === modeName)
    ).filter(Boolean)
    return orderedModes.map((mode) => toModeSlide(mode)).filter(Boolean)
  }, [modes])
  const modeCount = modeSlides.length
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const initialIndex = modeSlides.findIndex((mode) => mode.id === selectedModeId)
    return initialIndex >= 0 ? initialIndex : 0
  })
  const [transitionDirection, setTransitionDirection] = useState("right")
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationClass, setAnimationClass] = useState("")
  const overlayCardRef = useRef(null)
  const animationTimeoutRef = useRef(null)

  const activeIndex = modeCount ? Math.min(selectedIndex, modeCount - 1) : 0
  const selectedMode = modeSlides[activeIndex] ?? null

  useEffect(() => {
    overlayCardRef.current?.focus()

    return () => {
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  function startTransition(direction) {
    if (prefersReducedMotion) return

    if (animationTimeoutRef.current) {
      window.clearTimeout(animationTimeoutRef.current)
    }

    setTransitionDirection(direction)
    setAnimationClass(`slide-in-${direction}`)
    setIsAnimating(true)

    animationTimeoutRef.current = window.setTimeout(() => {
      setIsAnimating(false)
      setAnimationClass("")
    }, 230)
  }

  function selectModeByIndex(index, direction) {
    if (!canChangeMode || !modeCount || isAnimating) return

    const wrappedIndex = ((index % modeCount) + modeCount) % modeCount
    if (wrappedIndex === activeIndex) return

    const nextMode = modeSlides[wrappedIndex]
    if (!nextMode) return

    setSelectedIndex(wrappedIndex)
    onSelectMode?.(nextMode.id)
    startTransition(direction)
  }

  function goPrev() {
    selectModeByIndex((activeIndex - 1 + modeCount) % modeCount, "left")
  }

  function goNext() {
    selectModeByIndex((activeIndex + 1) % modeCount, "right")
  }

  function handleStartSelectedMode() {
    if (!selectedMode || isAnimating) return
    onStart?.()
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      goPrev()
      return
    }

    if (event.key === "ArrowRight") {
      event.preventDefault()
      goNext()
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      handleStartSelectedMode()
      return
    }

    if (event.key === "Escape") {
      onClose?.()
    }
  }

  const startButtonLabel = selectedMode ? `Start ${selectedMode.name}` : "Start Round"
  const currentModePosition = modeCount ? activeIndex + 1 : 0

  return (
    <div
      className="gameOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="round-ready-title"
    >
      <section
        className="gameOverCard readyCard readyCardStack readyCardChoosing"
        ref={overlayCardRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <h2 id="round-ready-title" className="readyTitle">
          Choose Mode
        </h2>
        <p className="readyLead">
          Use left and right to cycle modes, then press Enter to start.
        </p>
        <div className="modeProgressDots" aria-label={`Mode ${currentModePosition} of ${modeCount}`}>
          {modeSlides.map((mode, index) => (
            <span
              key={`mode-dot-${mode.id}`}
              className={`modeProgressDot ${index === activeIndex ? "active" : ""}`}
              aria-hidden="true"
            />
          ))}
        </div>

        <div className="modeCarousel" aria-label="Mode navigation controls">
          <button
            className="modeArrowButton"
            type="button"
            onClick={goPrev}
            disabled={!canChangeMode || !modeCount || isAnimating}
            aria-label="Select previous mode"
          >
            <span aria-hidden="true">&#8249;</span>
          </button>

          <div className="modeDeckViewport" role="listbox" aria-label="Mode carousel">
            <p className="modeSelectionLive" aria-live="polite">
              Selected mode: {selectedMode?.name ?? "Unknown"}
            </p>
            <div className="modeDeckCard" role="option" aria-selected="true">
              <ModePreviewContent
                mode={selectedMode}
                animationClass={prefersReducedMotion ? "" : animationClass}
                key={`${selectedMode?.id ?? "unknown"}-${transitionDirection}`}
              />
            </div>
          </div>

          <button
            className="modeArrowButton"
            type="button"
            onClick={goNext}
            disabled={!canChangeMode || !modeCount || isAnimating}
            aria-label="Select next mode"
          >
            <span aria-hidden="true">&#8250;</span>
          </button>
        </div>

        <div className="overlayActions readyActions">
          <div className="readyPrimaryActionGroup">
            <button className="primaryButton" onClick={handleStartSelectedMode} disabled={!selectedMode || isAnimating}>
              {startButtonLabel}
            </button>
            <Link className="secondaryButton readyHelpLink" to="/help">
              How To Play
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export function CountdownOverlay({ countdownValue }) {
  return (
    <div className="gameOverlay" role="status" aria-live="polite">
      <section className="countdownCard">
        <p>Starting In</p>
        <div className="countdownNumber">{countdownValue}</div>
      </section>
    </div>
  )
}

export function GameOverOverlay({
  score,
  bestScore = null,
  hits,
  misses,
  bestStreak,
  accuracy,
  modeLabel,
  playerXpIntoLevel = 0,
  playerXpToNextLevel = 0,
  roundXpEarned = 0,
  roundCoinsEarned = 0,
  allowsCoinRewards = false,
  allowsLevelProgression = false,
  playerRankMmr = 0,
  roundRankDelta = 0,
  allowsRankProgression = false,
  selectedModeId,
  onPlayAgain,
  onChooseMode,
}) {
  const rewardsSummaryText = getModeRewardsSummary({
    allowsCoinRewards,
    allowsLevelProgression,
    allowsRankProgression,
  })
  const isPracticeMode = !allowsCoinRewards && !allowsLevelProgression && !allowsRankProgression
  const hasPriorBestScore = Number.isFinite(bestScore)
  const isNewBestScore = hasPriorBestScore && score > bestScore
  const hasCleanRun = misses === 0
  const scoreBadgeText = isNewBestScore ? "New Best" : hasCleanRun ? "Clean Run" : ""
  const projectedMmr = Math.max(0, playerRankMmr + roundRankDelta)
  const projectedRankLabel = getRankTierFromMmr(projectedMmr).label
  const levelXpCap = playerXpIntoLevel + playerXpToNextLevel
  const levelXpAfterRound = Math.min(levelXpCap, playerXpIntoLevel + roundXpEarned)

  const performanceRows = [
    { label: "Hits", value: hits },
    { label: "Misses", value: misses },
    { label: "Accuracy", value: accuracy },
    { label: "Best Streak", value: bestStreak },
  ]

  const rewardRows = []
  if (allowsLevelProgression) {
    rewardRows.push({
      label: "Level Progress",
      value: `${levelXpAfterRound}/${levelXpCap} XP`,
      group: "status",
    })
  }
  if (allowsRankProgression) {
    rewardRows.push({ label: "MMR After Match", value: `${projectedMmr}`, group: "status" })
    rewardRows.push({ label: "New Rank", value: projectedRankLabel, group: "status" })
  }
  const tone = getGameOverTone({ hits, misses, accuracy, bestStreak })
  const prefersReducedMotion = usePrefersReducedMotion()
  const animatedScore = useCountUpNumber(score, {
    durationMs: 700,
    disabled: prefersReducedMotion,
  })
  const animatedXp = useCountUpNumber(roundXpEarned, {
    durationMs: 500,
    delayMs: 70,
    disabled: prefersReducedMotion,
  })
  const animatedCoins = useCountUpNumber(roundCoinsEarned, {
    durationMs: 500,
    delayMs: 130,
    disabled: prefersReducedMotion,
  })
  const animatedRankDelta = useCountUpNumber(roundRankDelta, {
    durationMs: 500,
    delayMs: 190,
    disabled: prefersReducedMotion,
  })
  const isScoreAnimationDone = prefersReducedMotion || animatedScore === score
  const formattedScore = Number(animatedScore).toLocaleString()

  const summaryRewardRows = []
  if (allowsLevelProgression) {
    summaryRewardRows.push({
      label: "XP Earned",
      value: `+${animatedXp}`,
    })
  }
  if (allowsCoinRewards) {
    summaryRewardRows.push({
      label: "Coins Earned",
      value: `+${animatedCoins}`,
    })
  }
  if (allowsRankProgression) {
    summaryRewardRows.push({
      label: "Rank Delta",
      value: formatSignedValue(animatedRankDelta),
    })
  }

  return (
    <div
      className="gameOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
    >
      <section
        className={`gameOverCard gameOverCardWithDifficulty difficultyMood-${selectedModeId} gameOverTone-${tone}`}
      >
        <header className="gameOverHeader">
          <h2 id="game-over-title" className="gameOverTitle">
            Round Complete
          </h2>
        </header>

        <section
          className={`gameOverScorePanel ${isScoreAnimationDone ? "isComplete" : ""}`}
          aria-label="Final score summary"
        >
          <p className="gameOverScoreLabel">Final Score</p>
          <p className="gameOverScoreValue">{formattedScore}</p>
          {scoreBadgeText ? (
            <p className="gameOverScoreBadge" aria-label="Score highlight">
              {scoreBadgeText}
            </p>
          ) : null}
          <p className="gameOverDifficultyBadge">{modeLabel}</p>
          {summaryRewardRows.length ? (
            <div className="gameOverSummaryRewards" aria-label={rewardsSummaryText}>
              {summaryRewardRows.map((row) => (
                <p key={row.label} className="gameOverSummaryRewardRow">
                  <span className="gameOverSummaryRewardLabel">{row.label}</span>
                  <strong className="gameOverSummaryRewardValue">{row.value}</strong>
                </p>
              ))}
            </div>
          ) : (
            <p className="gameOverRewardsLine">{rewardsSummaryText}</p>
          )}
        </section>

        <div className="gameOverBody">
          <div className="gameOverSections" aria-label="Round summary">
            <GameOverSection title="Performance" rows={performanceRows} panelType="performance" />
            <GameOverSection title="Rewards" rows={rewardRows} panelType="rewards" />
          </div>
          {isPracticeMode ? (
            <p className="gameOverPracticeNote">Rewards are not earned in Practice mode.</p>
          ) : null}
        </div>

        <div className="overlayActions gameOverActions">
          <button className="primaryButton" onClick={onPlayAgain}>
            Play Again
          </button>
          {isPracticeMode ? (
            <button className="secondaryButton" type="button" onClick={onChooseMode}>
              Back to Modes
            </button>
          ) : (
            <Link className="secondaryButton" to="/history">
              View History
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}




