# MASTER TODO — ClickAway
> Full creative implementation plans for all open work.
> Last updated: 2026-04-02
> Organized by execution priority. Within each section, top items should be done first.

---

## PART 1 — Technical Fixes
> These unblock clean implementation of everything else. Do these before building new features.

---

### FIX-01 — Add untracked files to git

**Priority:** Blocker  
**Effort:** 5 minutes

Two production files have never been committed. `TierBadge.jsx` is imported by `GameOverOverlay.jsx` and `LeaderboardPage.jsx`. `add_round_reaction_metrics.sql` is a live schema migration.

**Implementation:**
```
git add src/components/TierBadge.jsx
git add server/data/add_round_reaction_metrics.sql
git commit -m "track TierBadge component and reaction metrics DB migration"
```

Add a header comment to the SQL file noting date applied and environment:
```sql
-- Migration: add avg_reaction_ms and best_reaction_ms to round_history
-- Applied: 2026-04-02 | Environment: local dev
-- Safe to re-run (uses ADD COLUMN IF NOT EXISTS)
ALTER TABLE `round_history`
  ADD COLUMN IF NOT EXISTS `avg_reaction_ms` int(11) DEFAULT NULL AFTER `best_streak`,
  ADD COLUMN IF NOT EXISTS `best_reaction_ms` int(11) DEFAULT NULL AFTER `avg_reaction_ms`;
```

**Files:** `src/components/TierBadge.jsx`, `server/data/add_round_reaction_metrics.sql`

---

### FIX-02 — Remove dead `difficultyId` field from history entries

**Priority:** High  
**Effort:** 15 minutes

`createHistoryEntry` in `historyUtils.js` emits both `modeId` and `difficultyId` with identical values. `difficultyId` is a dead backwards-compat alias from a rename that never got cleaned up.

**Implementation:**

1. In `src/utils/historyUtils.js`, remove the `difficultyId` parameter from the JSDoc and the destructured params, and remove `difficultyId: resolvedModeId` from the returned object.

2. Run: `grep -r "difficultyId" src/` to confirm no consumer reads `entry.difficultyId`. The only live reference in non-history code is `rankUtils.js:99` which reads `modeId || difficultyId` — that ref is fine, it's for the `calculateRoundRankDelta` function signature, not the history object.

3. The `difficultyId` param in `calculateRoundRankDelta` (rankUtils.js) can stay as a safety fallback — do not remove it. Only remove the field from the history entry shape.

**Files:** `src/utils/historyUtils.js` (lines 76, 97)

---

### FIX-03 — Extract `formatNumber` and `formatReactionTime` into a shared util

**Priority:** High  
**Effort:** 20 minutes

Both functions are copy-pasted identically in `GameOverOverlay.jsx:25–42` and `ProfilePage.jsx:72–80`.

**Implementation:**

Create `src/utils/formatUtils.js`:
```js
export function formatNumber(value = 0) {
  return Number(value).toLocaleString()
}

export function formatReactionTime(value) {
  const normalizedValue = Number(value)
  if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) return "\u2014"
  return `${Math.round(normalizedValue)} ms`
}
```

In `GameOverOverlay.jsx`: remove the two local function definitions, add `import { formatNumber, formatReactionTime } from "../../../../utils/formatUtils.js"`.

In `ProfilePage.jsx`: same removal and import from `"../utils/formatUtils.js"`.

**Files:** `src/utils/formatUtils.js` (new), `src/features/game/components/roundOverlays/GameOverOverlay.jsx`, `src/pages/ProfilePage.jsx`

---

### FIX-04 — Fix `ReadyOverlay` hardcoded mode metadata

**Priority:** High  
**Effort:** 45 minutes

`ReadyOverlay.jsx` defines `MODE_COPY` and `MODE_ORDER` as static arrays disconnected from `difficultyConfig.js`. If a mode is added or renamed in config, the carousel breaks silently.

**Implementation:**

1. In `difficultyConfig.js`, add a `displayCopy` field to each mode object:
```js
// Practice
displayCopy: {
  glyph: "1",
  description: "Train mechanics.",
},
// Casual
displayCopy: {
  glyph: "2",
  description: "Earn XP + coins.",
},
// Ranked
displayCopy: {
  glyph: "\u2694",
  description: "Earn XP + coins + rank. Harder penalties.",
},
```

2. In `ReadyOverlay.jsx`, delete `MODE_ORDER`, `MODE_COPY`, and `MODE_COPY_BY_NAME` entirely.

3. Update `toModeSlide(mode)` to read from `mode.displayCopy` instead of the local lookup:
```js
function toModeSlide(mode) {
  if (!mode) return null
  const name = getModeLabelFromModeConfig(mode)
  const round = mode.isTimedRound === false ? "No limit" : `${mode.durationSeconds}s`
  const miss = mode.missPenalty > 0 ? `-${mode.missPenalty}` : "None"
  return {
    id: mode.id,
    name,
    tone: name.toLowerCase(),
    glyph: mode.displayCopy?.glyph ?? name.charAt(0),
    description: mode.displayCopy?.description ?? mode.playerHint,
    round,
    miss,
    shrink: getShrinkPaceLabel(mode.shrinkFactor),
    footer: getModeFooterText(mode),
  }
}
```

4. The `modeSlides` memo already sorts by iterating `modes` — remove the `MODE_ORDER` sort and just use `modes` in config order (or add an explicit `sortOrder: 0/1/2` field to difficultyConfig if order must be enforced independently).

**Files:** `src/constants/difficultyConfig.js`, `src/features/game/components/roundOverlays/ReadyOverlay.jsx`

---

### FIX-05 — Resolve leaderboard profile click stub

**Priority:** High  
**Effort:** 30 minutes

`handleProfileOpen` does `console.log(...)` for non-current-user rows. The UI implies interactivity that doesn't exist.

**Implementation (recommended: remove interactivity, not add a full profile view):**

Since building a full player profile view is a larger feature, the right short-term fix is to stop implying rows are clickable for other players.

1. In `LeaderboardPage.jsx`, change `handleProfileOpen` to only handle the current user:
```js
function handleProfileOpen(player, isCurrentUser) {
  if (!isCurrentUser) return
  navigate("/profile")
}
```

2. Only apply the click handler and interactive cursor styling to the current user's row. Other rows should not have `onClick` or a pointer cursor.

3. If a player profile view is later built (as a modal or separate route), add it then.

**Files:** `src/pages/LeaderboardPage.jsx`

---

### FIX-06 — Standardize achievement ID naming across all layers

**Priority:** Medium  
**Effort:** 20 minutes

Three names for the same value: `unlockedAchievementIds` (App.jsx), `persistedAchievementIds` (ProfilePage prop), `persistedUnlockedIds` (evaluateAchievements options key).

**Implementation:**

Standardize on `unlockedAchievementIds` everywhere.

1. In `App.jsx`: no change needed (already `unlockedAchievementIds` in state and prop).
2. In `ProfilePage.jsx`: rename the prop from `persistedAchievementIds` to `unlockedAchievementIds`. Update the destructuring and the call to `evaluateAchievements`.
3. In `evaluateAchievements.js`: rename `options.persistedUnlockedIds` to `options.unlockedAchievementIds`. Update the internal `new Set(...)` call.
4. Grep for any other references to `persistedAchievementIds` or `persistedUnlockedIds`.

**Files:** `src/pages/ProfilePage.jsx`, `src/game/achievements/evaluateAchievements.js`

---

### FIX-07 — Remove redundant `fetchCurrentUser` after shop actions

**Priority:** Medium  
**Effort:** 30 minutes

Both `handlePurchase` and `handleEquip` in `useShopActions.js` call the shop API, then immediately call `fetchCurrentUser` for a second round-trip. Confirm whether the shop API responses already return full player state.

**Implementation:**

1. Inspect `purchaseShopItem` and `equipShopItem` response shapes from `src/services/api.js`.
2. If the response includes `progress` (coins, ownedItems, equippedIds), remove the `fetchCurrentUser` call and its `applyProgress` call from both handlers.
3. If the shop response does NOT return complete state, add a comment explaining why the double-fetch is intentional and what would need to change to eliminate it.
4. Either way, the current code runs `applyPlayerState(playerState)` and then `applyProgress(latestSession.progress)` in sequence — if both update the same state, the second one may be overwriting the first with stale data from a race. Fix the ordering or merge into one update.

**Files:** `src/app/useShopActions.js`, `src/services/api.js`

---

### FIX-08 — Add missing UI completeness items

**Priority:** Low  
**Effort:** 1 hour total

Three small gaps:

**8a — History page empty state:**  
In `src/pages/HistoryPage.jsx`, when `roundHistory.length === 0`, render:
```jsx
<div className="historyEmpty">
  <p>No rounds played yet.</p>
  <Link to="/game" className="primaryButton">Play your first round</Link>
</div>
```

**8b — PlayerHoverCard "Rounds Played" row:**  
In `src/components/PlayerHoverCard.jsx`, add a stat row for `totalRounds` using whatever player object field holds the round count. If not currently exposed by the leaderboard API response, add it to the backend query and `normalizeLeaderboardRow`.

**8c — History page summary strip:**  
Above the history table in `HistoryPage.jsx`, add a strip showing career totals derived from `roundHistory`:
```js
const summary = buildPlayerLeaderboardStats(roundHistory) // already exists in historyUtils
const totalCoins = roundHistory.reduce((sum, r) => sum + (Number(r.coinsEarned) || 0), 0)
const totalXp = roundHistory.reduce((sum, r) => sum + (Number(r.xpEarned) || 0), 0)
```
Display: Total Rounds, Best Score, Best Streak, Career Accuracy, Total XP Earned, Total Coins Earned.

**Files:** `src/pages/HistoryPage.jsx`, `src/components/PlayerHoverCard.jsx`

---

## PART 2 — Quick Win Retention Features
> Low effort, high psychological impact. Implement these in one focused session.

---

### QW-01 — Rematch Button (Zero-Friction Requeue)

**Priority:** Highest of all retention work  
**Effort:** 1 hour

After a round ends, "Play Again" dumps the player into the mode carousel. On a 15-second ranked round, this dead time is proportionally catastrophic. A Rematch button skips the carousel entirely.

**Implementation:**

**Step 1 — Add `onRematch` callback to `GameOverOverlay`:**
```js
export function GameOverOverlay({
  // ... existing props
  onPlayAgain,   // existing — goes to READY (carousel)
  onRematch,     // new — restarts same mode immediately
  onChooseMode,
})
```

**Step 2 — In `useGameScreenController.js`, add a `startRematch` function:**
```js
const startRematch = useCallback(() => {
  // Reset all round state
  hasAwardedRoundRef.current = false
  reactionTotalMsRef.current = 0
  reactionSampleCountRef.current = 0
  setScore(0)
  setStreak(0)
  setBestStreak(0)
  setHits(0)
  setMisses(0)
  setAvgReactionMs(null)
  setBestReactionMs(null)
  setPowerupCharges(buildInitialPowerupCharges())
  setClickFeedbackItems([])

  // Snapshot current player state for this round
  setRoundStartBestScore(playerBestScore)
  setRoundStartLevel(playerLevel)
  setRoundStartXpIntoLevel(playerXpIntoLevel)
  setRoundStartXpToNextLevel(playerXpToNextLevel)
  setRoundStartRankMmr(playerRankMmr)
  setRoundStartRankLabel(playerRankLabel)

  // Reset button to initial size and re-center
  const nextMode = getModeById(selectedModeId)
  setRoundMode(nextMode)
  setButtonSize(nextMode.initialButtonSize)
  setTimeLeft(nextMode.durationSeconds)
  centerButtonPosition(nextMode.initialButtonSize)

  // Skip READY — go straight to countdown
  setCountdownValue(READY_COUNTDOWN_START)
  setPhase(ROUND_PHASE.COUNTDOWN)
}, [/* all the deps */])
```

**Step 3 — Expose `startRematch` in the return value of `useGameScreenController` and pass it down through `GamePage` to `GameOverOverlay` as `onRematch`.**

**Step 4 — In `GameOverOverlay` actions, change button layout:**
```jsx
<div className="overlayActions gameOverActions">
  <button className="primaryButton primaryButton-lg" onClick={onRematch}>
    Rematch
  </button>
  <button className="secondaryButton" type="button" onClick={onPlayAgain}>
    Change Mode
  </button>
  {!isPracticeMode ? (
    <Link className="tertiaryLink" to="/history">View History</Link>
  ) : null}
</div>
```

For Practice mode specifically, "Rematch" still makes sense as primary (untimed, drill-focused). "Change Mode" stays as secondary.

**Files:** `src/features/game/components/roundOverlays/GameOverOverlay.jsx`, `src/features/game/hooks/useGameScreenController.js`, `src/pages/GamePage.jsx`

---

### QW-02 — Near-Miss Score Messaging

**Priority:** Very high  
**Effort:** 30 minutes

The most impactful single line of copy in the game. When a player is close to their personal best but doesn't beat it, say so. Near-miss psychology dramatically increases immediate requeue motivation.

**Implementation:**

In `GameOverOverlay.jsx`, extend the `scoreBadgeText` logic:
```js
const scoreDelta = bestScore > 0 ? bestScore - score : null
const isNearMiss = scoreDelta !== null && scoreDelta > 0 && scoreDelta <= Math.ceil(bestScore * 0.12)

const scoreBadgeText = isNewBestScore
  ? "New Personal Best!"
  : hasCleanRun
    ? "Clean Run"
    : isNearMiss
      ? `${scoreDelta.toLocaleString()} from your best`
      : ""
```

The 12% threshold means "within 12% of best score shows the message." Tune this after playtesting — might want tighter (8%) or looser (15%).

Add analogous logic for best streak near-miss:
```js
// props: careerBestStreak (new prop, passed from App.jsx via playerLeaderboardStats.bestStreak)
const streakDelta = careerBestStreak > 0 ? careerBestStreak - bestStreak : null
const isStreakNearMiss = streakDelta !== null && streakDelta > 0 && streakDelta <= 3

// In performanceRows, annotate the bestStreak row if isStreakNearMiss:
{ label: "Best Streak", value: bestStreak, note: isStreakNearMiss ? `${streakDelta} from your record` : "" }
```

Pass `careerBestStreak` down from `App.jsx` → `GamePage` → `useGameScreenController` → `GameOverOverlay`. `playerLeaderboardStats.bestStreak` already exists in App.jsx.

**Files:** `src/features/game/components/roundOverlays/GameOverOverlay.jsx`, `src/features/game/hooks/useGameScreenController.js`, `src/pages/GamePage.jsx`, `src/App.jsx`

---

### QW-03 — Personal Best Shown in HUD During Round

**Priority:** Very high  
**Effort:** 30 minutes

During a round, the player has no reference to their personal best. The HUD should show it. When they exceed it mid-round, it flashes green.

**Implementation:**

**Step 1 — Add `bestScore` to `hudProps` in `useGameScreenController.js`:**
```js
hudProps: {
  score,
  timeLeft,
  // ... existing
  bestScore: roundStartBestScore,   // already tracked in state
  isNewBestScore: score > roundStartBestScore,
}
```

**Step 2 — In `GameHud.jsx`, add the PB display:**
```jsx
export default function GameHud({
  // ... existing props
  bestScore = 0,
  isNewBestScore = false,
}) {
  // In the score block, below the score number:
  {bestScore > 0 ? (
    <span className={`hudBestScore${isNewBestScore ? " hudBestScoreBeaten" : ""}`}>
      PB {bestScore.toLocaleString()}
    </span>
  ) : null}
}
```

**Step 3 — In `game.css`, add:
```css
.hudBestScore {
  font-size: var(--font-xs);
  color: var(--text-muted);
  transition: color 0.2s;
}
.hudBestScoreBeaten {
  color: var(--color-success); /* green */
  font-weight: 600;
  animation: hudBestScorePulse 0.4s ease-out;
}
@keyframes hudBestScorePulse {
  0% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

The `isNewBestScore` prop recalculates on every score change since score is reactive state, so the green flash will trigger mid-round the moment the player exceeds their best.

**Files:** `src/features/game/hooks/useGameScreenController.js`, `src/features/game/components/GameHud.jsx`, `src/styles/components/game.css`

---

### QW-04 — Streak Record Celebration

**Priority:** High  
**Effort:** 45 minutes

A new career-best streak is currently displayed as a plain number in the performance table. It deserves a badge with the same energy as "New Personal Best!"

**Implementation:**

**Step 1 — Pass `careerBestStreak` into `GameOverOverlay` (same prop added for QW-02).**

**Step 2 — Add detection:**
```js
const isNewBestStreak = bestStreak > 0 && bestStreak > careerBestStreak
```

**Step 3 — In the `performanceRows` array, annotate the streak row:**
```js
{
  label: "Best Streak",
  value: bestStreak,
  highlight: isNewBestStreak,
  badge: isNewBestStreak ? "New Record!" : "",
}
```

**Step 4 — Update `GameOverSection` (or wherever rows render) to show a gold badge on highlighted rows.** If `GameOverSection` renders simple `{label, value}` pairs, add a `badge` field to the row shape and render it as a styled `<span>` next to the value.

**Step 5 — If `isNewBestStreak`, also add a line to the score panel area below `scoreBadgeText` (or a second badge element) so both a score near-miss and a streak record can display simultaneously.

**Files:** `src/features/game/components/roundOverlays/GameOverOverlay.jsx`, `src/App.jsx`, `src/pages/GamePage.jsx`

---

### QW-05 — XP-to-Next-Level in GameOverOverlay

**Priority:** High  
**Effort:** 20 minutes

The XP bar fills during the overlay animation but nowhere does it tell the player how far they are from the next level. Add a concrete countdown label.

**Implementation:**

After the XP animation completes (`isXpAnimationComplete === true`), show a contextual line below the XP bar:
```jsx
{isXpAnimationComplete && allowsLevelProgression ? (
  <p className="gameOverXpCountdown">
    {displayedXpForNextLevel.toLocaleString()} XP to Level {displayedLevel + 1}
  </p>
) : null}
```

The values `displayedXpForNextLevel` and `displayedLevel` are already available as state in `GameOverOverlay` from the XP animation system. This requires zero new data — just a new render line that appears after animation finishes.

Style as small, muted text below the XP bar — not competing with the bar itself, just anchoring the "what's next" question.

**Files:** `src/features/game/components/roundOverlays/GameOverOverlay.jsx`

---

### QW-06 — Contextual GameOver Copy for Ranked Losses

**Priority:** High  
**Effort:** 30 minutes

After a ranked round with negative MMR delta, the overlay says "Round Complete" and shows a red number. Nothing frames it as a recoverable position or creates a reason to queue again.

**Implementation:**

Add a `getGameOverHeadline` function to `GameOverOverlay.jsx`:
```js
function getGameOverHeadline({ tone, allowsRankProgression, roundRankDelta, mmrToNextTier }) {
  if (allowsRankProgression && roundRankDelta < 0) {
    if (mmrToNextTier > 0 && mmrToNextTier <= 100) {
      return `${mmrToNextTier} MMR to your next tier`
    }
    return "Recover in the next round"
  }
  if (tone === "elite") return "Elite performance"
  if (tone === "steady") return "Round Complete"
  return "Round Complete"
}
```

Pass `mmrToNextTier` — this is already computable: `Math.max(0, nextTierMinMmr - projectedMmr)`. The `projectedMmr` is already computed in GameOverOverlay. The `nextTierMinMmr` requires knowing what the next tier boundary is — import from `rankUtils.js` or compute alongside the `projectedRankLabel`.

Replace the hardcoded `"Round Complete"` h2 text with `{getGameOverHeadline(...)}`.

Also: change the second action button after a ranked loss from "View History" to "Queue Ranked" (which calls `onRematch` if mode is already ranked, or `onChooseMode` with ranked pre-selected if not). This turns the loss screen into a forward-pointing call to action.

**Files:** `src/features/game/components/roundOverlays/GameOverOverlay.jsx`, `src/utils/rankUtils.js`

---

### QW-07 — Clean Run Visual Treatment Upgrade

**Priority:** Medium  
**Effort:** 20 minutes

"Clean Run" (zero misses) is currently a text badge with the same styling as "New Personal Best!" A perfect round with zero misses is an extraordinary achievement in a game where the button moves and shrinks. It deserves distinct, gold-tinted visual treatment.

**Implementation:**

In `GameOverOverlay.jsx`, split `scoreBadgeText` into a badge object with a type:
```js
const scoreBadge = isNewBestScore
  ? { text: "New Personal Best!", type: "personal-best" }
  : hasCleanRun
    ? { text: "Clean Run", type: "clean-run" }
    : isNearMiss
      ? { text: `${scoreDelta.toLocaleString()} from your best`, type: "near-miss" }
      : null
```

In the JSX:
```jsx
{scoreBadge ? (
  <p className={`gameOverScoreBadge gameOverScoreBadge-${scoreBadge.type}`} aria-label="Score highlight">
    {scoreBadge.text}
  </p>
) : null}
```

In `game.css`:
```css
.gameOverScoreBadge-clean-run {
  color: var(--color-gold);
  border-color: var(--color-gold);
  background: rgba(gold, 0.1); /* adjust to tokens */
}
.gameOverScoreBadge-near-miss {
  color: var(--text-muted);
  font-style: italic;
}
.gameOverScoreBadge-personal-best {
  /* existing .gameOverScoreBadge styles work here */
}
```

**Files:** `src/features/game/components/roundOverlays/GameOverOverlay.jsx`, `src/styles/components/game.css`

---

### QW-08 — Cosmetic Purchase Celebration

**Priority:** Medium  
**Effort:** 45 minutes

Buying a cosmetic currently updates state silently. A purchase should feel like an event.

**Implementation:**

In the shop component that calls `onPurchase` / `onEquip` (likely `ShopItemCard.jsx` or the parent `ShopPage`):

1. After a successful purchase, set a `justPurchasedItemId` state for 2 seconds:
```js
const [justPurchasedItemId, setJustPurchasedItemId] = useState(null)

async function handlePurchaseClick(item) {
  const result = await onPurchase(item)
  if (result.ok) {
    setJustPurchasedItemId(item.id)
    setTimeout(() => setJustPurchasedItemId(null), 2000)
  }
}
```

2. In `ShopItemCard.jsx`, accept a `isJustPurchased` prop and apply a CSS class:
```jsx
<article className={`shopItemCard ${isJustPurchased ? "isJustPurchased" : ""} ...`}>
```

3. CSS:
```css
.shopItemCard.isJustPurchased {
  animation: shopItemPurchasedPulse 0.5s ease-out;
  border-color: var(--color-success);
}
@keyframes shopItemPurchasedPulse {
  0% { transform: scale(1.04); box-shadow: 0 0 12px var(--color-success); }
  100% { transform: scale(1); box-shadow: none; }
}
```

4. In `ShopHeroHeader.jsx`'s `LoadoutStage`, when the equipped item changes, add a brief CSS class `isUpdated` that fades out after 1s. This makes the loadout preview react to purchases.

**Files:** `src/features/shop/components/ShopItemCard.jsx`, `src/pages/ShopPage.jsx`, `src/styles/components/shop.css`

---

## PART 3 — Core Retention Upgrades
> Medium complexity. These significantly deepen the retention loops. Plan as a focused sprint.

---

### RET-01 — Per-Round Grade (S / A / B / C / D)

**Priority:** Very high  
**Effort:** 2–3 hours

A letter grade gives players an immediate, specific goal for the next run. "I got a B — I want an A" is psychologically cleaner than "I want a better score." Players will optimize toward the grade threshold without knowing they're doing it.

**Implementation:**

**Step 1 — Create `src/utils/roundGradeUtils.js`:**
```js
// Grades are determined by a weighted combination of accuracy + bestStreak + score
// relative to the player's own baseline. Absolute thresholds work fine as a starting point.

export function calculateRoundGrade({ accuracy, bestStreak, score, hits }) {
  // accuracy is already a formatted string like "78%" — parse it
  const accuracyValue = parseInt(String(accuracy).replace("%", ""), 10) || 0

  // Each criterion awards points
  let gradePoints = 0

  // Accuracy (0–40 points)
  if (accuracyValue >= 97) gradePoints += 40
  else if (accuracyValue >= 90) gradePoints += 30
  else if (accuracyValue >= 80) gradePoints += 20
  else if (accuracyValue >= 70) gradePoints += 10
  else gradePoints += 0

  // Streak (0–30 points)
  if (bestStreak >= 20) gradePoints += 30
  else if (bestStreak >= 12) gradePoints += 22
  else if (bestStreak >= 7) gradePoints += 14
  else if (bestStreak >= 3) gradePoints += 7
  else gradePoints += 0

  // Hits volume (0–30 points)
  if (hits >= 40) gradePoints += 30
  else if (hits >= 25) gradePoints += 22
  else if (hits >= 15) gradePoints += 14
  else if (hits >= 8) gradePoints += 7
  else gradePoints += 0

  // Map to grade
  if (gradePoints >= 90) return "S"
  if (gradePoints >= 72) return "A"
  if (gradePoints >= 52) return "B"
  if (gradePoints >= 32) return "C"
  return "D"
}

export function getGradeFeedback(grade, accuracy, bestStreak) {
  const accuracyValue = parseInt(String(accuracy).replace("%", ""), 10) || 0
  if (grade === "S") return "Perfect round."
  if (grade === "A") return "Strong performance."
  if (grade === "B") {
    if (accuracyValue < 80) return "Accuracy pulled the grade down — aim for 80%+."
    if (bestStreak < 7) return "Build longer streaks for a higher grade."
    return "Solid round — push the streak further."
  }
  if (grade === "C") return "Focus on accuracy and sustained streaks."
  return "Keep playing — the mechanics will click."
}
```

**Step 2 — Compute grade in `GameOverOverlay.jsx`:**
```js
import { calculateRoundGrade, getGradeFeedback } from "../../../../utils/roundGradeUtils.js"

const roundGrade = calculateRoundGrade({ accuracy, bestStreak, score, hits })
const gradeFeedback = getGradeFeedback(roundGrade, accuracy, bestStreak)
```

**Step 3 — Render in score panel:**
```jsx
<div className={`gameOverGrade gameOverGrade-${roundGrade.toLowerCase()}`}>
  {roundGrade}
</div>
<p className="gameOverGradeFeedback">{gradeFeedback}</p>
```

Style `.gameOverGrade` as a large, centered letter (64px) with tier-specific colors:
- S: gold
- A: green  
- B: blue
- C: orange
- D: muted red

**Step 4 — Store grade in history entry.** Add `grade: calculateRoundGrade(...)` to `createHistoryEntry` in `historyUtils.js`. Show it in the history table. Show grade distribution on Profile page ("Your rounds: 12% S, 34% A, 41% B, 13% C").

**Step 5 (optional later) — Show grade in leaderboard.** Replace the MMR badge with a "best grade" badge for casual mode rows, or show it as a secondary stat.

**Files:** `src/utils/roundGradeUtils.js` (new), `src/features/game/components/roundOverlays/GameOverOverlay.jsx`, `src/utils/historyUtils.js`, `src/styles/components/game.css`

---

### RET-02 — Achievement Progress in GameOverOverlay

**Priority:** Very high  
**Effort:** 3–4 hours

Achievements are invisible after a round. This connects the long-term achievement system to the immediate post-round moment — the highest-leverage time to create a next-round goal.

**Implementation:**

**Step 1 — Pass achievement state into GameOverOverlay.** The overlay needs to know which achievements are close to completion. Add an `achievementNudges` prop: a pre-computed array of `{ title, progressText, percentDone }` for the 1–2 achievements closest to unlocking.

**Step 2 — Compute nudges upstream.** In `useGameScreenController.js` or `GamePage.jsx`, after a round completes, compute achievement nudges:

```js
// This requires passing achievementStats down to GamePage (it's available in App.jsx)
function buildAchievementNudges(evaluatedAchievements) {
  return evaluatedAchievements
    .filter((a) => !a.isUnlocked && a.isProgressAvailable && a.percent >= 70)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 2)
    .map((a) => ({
      title: a.title,
      progressText: a.progressText,  // e.g. "47 / 50"
      percent: a.percent,
    }))
}
```

Pass `achievementStats` from `App.jsx` → `GamePage` as a prop. Compute `evaluatedAchievements` in GamePage using the same `evaluateAchievements` function used by ProfilePage. Compute nudges and pass as `achievementNudges` to GameOverOverlay.

**Step 3 — Render in GameOverOverlay:**
```jsx
{achievementNudges.length > 0 ? (
  <section className="gameOverAchievementNudges" aria-label="Achievement progress">
    <p className="gameOverNudgeLabel">Close to unlocking</p>
    {achievementNudges.map((nudge) => (
      <div key={nudge.title} className="gameOverNudgeRow">
        <span className="gameOverNudgeTitle">{nudge.title}</span>
        <span className="gameOverNudgeProgress">{nudge.progressText}</span>
        <div className="gameOverNudgeBar" aria-hidden="true">
          <span className="gameOverNudgeBarFill" style={{ width: `${nudge.percent}%` }} />
        </div>
      </div>
    ))}
  </section>
) : null}
```

Place this section at the bottom of the overlay body, below the performance/rewards panels, above the action buttons. It should feel like an "additionally" section, not competing with the score reveal.

**Step 4 — Achievement unlock toast.** Separately, when `useAchievementSync` detects a new unlock, fire a toast notification: a corner banner that appears for 3 seconds saying "Achievement Unlocked: [title]." This doesn't need to be a complex system — a simple queue-based toast context or a `useState` in App that shows a floating div.

**Files:** `src/features/game/components/roundOverlays/GameOverOverlay.jsx`, `src/pages/GamePage.jsx`, `src/App.jsx`, new toast component

---

### RET-03 — Level Milestone Unlocks

**Priority:** High  
**Effort:** 3–4 hours

Levels currently mean nothing. This makes them mean something at specific thresholds. The milestone reward can be a title, a coin bonus, or a cosmetic unlock — the content matters less than the existence of a destination.

**Implementation:**

**Step 1 — Define milestones in `src/constants/levelMilestones.js`:**
```js
export const LEVEL_MILESTONES = [
  { level: 5,  reward: { type: "title",    value: "Challenger",     coinBonus: 50 } },
  { level: 10, reward: { type: "title",    value: "Veteran",        coinBonus: 100 } },
  { level: 15, reward: { type: "coinBonus", coinBonus: 150 } },
  { level: 20, reward: { type: "title",    value: "Seasoned",       coinBonus: 200 } },
  { level: 30, reward: { type: "title",    value: "Dedicated",      coinBonus: 300 } },
  { level: 50, reward: { type: "title",    value: "Elite",          coinBonus: 500 } },
  { level: 75, reward: { type: "title",    value: "Legend",         coinBonus: 750 } },
  { level: 100,reward: { type: "title",    value: "Centurion",      coinBonus: 1000 } },
]

export function getMilestoneForLevel(level) {
  return LEVEL_MILESTONES.find((m) => m.level === level) ?? null
}

export function getNextMilestoneAboveLevel(level) {
  return LEVEL_MILESTONES.find((m) => m.level > level) ?? null
}
```

**Step 2 — Detect milestone crossing in GameOverOverlay.** The XP animation already detects level-ups (`levelUpMessage` state). When a level-up fires, check `getMilestoneForLevel(newLevel)`:
```js
// Inside the XP animation step processing
const milestone = getMilestoneForLevel(newLevel)
if (milestone) {
  setLevelUpMessage(`Level ${newLevel} — ${milestone.reward.value ?? "Milestone reached!"}`)
  // Extend the pause duration for milestone levels
}
```

**Step 3 — Add coin bonus to round reward.** If the player hit a milestone level this round, `roundCoinsEarned` should include the `coinBonus`. This needs to be computed in `useGameScreenController` and passed into `onRoundComplete`. After `usePlayerProgressionUpdates` updates XP and detects level-up, check for milestone and apply the coin bonus. This requires comparing `levelBefore` and `levelAfter` in the update hook.

Simpler approach for v1: compute whether the XP award crosses a milestone in `calculateRoundXp` or after it, and return an `milestoneBonus` alongside. Pass through to the overlay for display only (show in the rewards section as "Level milestone bonus: +100 coins"), and include it in `earnedCoins`.

**Step 4 — Title storage.** If the player earned a title, store the latest title alongside their player state. Add a `playerTitle` field in `useAppPlayerState`. Titles are deterministic from level — `getHighestEarnedTitle(level)` scans `LEVEL_MILESTONES` for the highest milestone ≤ current level and returns its title. No need to persist which titles were "unlocked" — just re-derive from level.

**Step 5 — Display title on Profile and Leaderboard.** Below the player name on Profile, show the title in smaller muted text. On the leaderboard `PlayerRow`, show title as a subtitle if one exists.

**Files:** `src/constants/levelMilestones.js` (new), `src/features/game/components/roundOverlays/GameOverOverlay.jsx`, `src/app/usePlayerProgressionUpdates.js`, `src/pages/ProfilePage.jsx`, `src/pages/LeaderboardPage.jsx`

---

### RET-04 — Ranked Sub-Tiers (9 Divisions)

**Priority:** High  
**Effort:** 4–5 hours

Three rank tiers is catastrophically few. Players spend most of their time far from any milestone. Sub-tiers mean you are always within 60–120 MMR of a promotion.

**Implementation:**

**Step 1 — Redesign `RANK_TIERS` in `rankUtils.js`:**
```js
const RANK_TIERS = [
  { id: "bronze-3", label: "Bronze III",   tierId: "bronze", division: 3, minMmr: 1   },
  { id: "bronze-2", label: "Bronze II",    tierId: "bronze", division: 2, minMmr: 125 },
  { id: "bronze-1", label: "Bronze I",     tierId: "bronze", division: 1, minMmr: 250 },
  { id: "silver-3", label: "Silver III",   tierId: "silver", division: 3, minMmr: 400 },
  { id: "silver-2", label: "Silver II",    tierId: "silver", division: 2, minMmr: 550 },
  { id: "silver-1", label: "Silver I",     tierId: "silver", division: 1, minMmr: 700 },
  { id: "gold-3",   label: "Gold III",     tierId: "gold",   division: 3, minMmr: 900 },
  { id: "gold-2",   label: "Gold II",      tierId: "gold",   division: 2, minMmr: 1100 },
  { id: "gold-1",   label: "Gold I",       tierId: "gold",   division: 1, minMmr: 1350 },
  { id: "platinum", label: "Platinum",     tierId: "platinum",division: 0, minMmr: 1650 },
]
```

**Step 2 — Update `getRankTierFromMmr` and `getRankProgress` to return division-aware data:**
```js
export function getRankProgress(mmr) {
  const normalizedMmr = clampNonNegative(mmr)
  const tier = getRankTierFromMmr(normalizedMmr)
  const tierIndex = RANK_TIERS.findIndex((t) => t.id === tier.id)
  const nextTier = RANK_TIERS[tierIndex + 1] ?? null
  const mmrToNextDivision = nextTier ? Math.max(0, nextTier.minMmr - normalizedMmr) : 0

  return {
    mmr: normalizedMmr,
    tierId: tier.id,
    tierLabel: tier.label,           // "Silver II" not just "Silver"
    broadTierId: tier.tierId,        // "silver" — for image lookups, CSS classes
    nextTierLabel: nextTier?.label ?? "Max",
    mmrToNextDivision,               // renamed from mmrToNextTier
    isAtMax: !nextTier,
    isUnranked: false,
  }
}
```

**Step 3 — Update `getRankImageSrc` to use `broadTierId` for image path.** The rank image files are presumably `/ranks/bronze.png`, `/ranks/silver.png` etc. Sub-tier labels like "Bronze II" should still resolve to `/ranks/bronze.png`.

**Step 4 — Update `TierBadge.jsx`.** It currently uses `tierLabel.toLowerCase()` to generate the CSS class (`is-bronze`). With sub-tiers, `tierLabel = "Bronze II"` would generate `is-bronze ii` which is broken. Fix:
```js
// Pass broadTierId explicitly, or derive it
const tierVariant = String(tierLabel || "Unranked").toLowerCase().split(" ")[0] // "bronze", "silver" etc.
const resolvedClassName = `tierBadge is-${tierVariant} ${className}`.trim()
```

And also render the division number alongside the tier image:
```jsx
<span className={resolvedClassName}>
  {rankImageSrc ? <img src={rankImageSrc} alt="" className="tierBadgeIcon" /> : null}
  <span>{normalizedLabel}</span>
</span>
```
No change needed — this already works. Just ensure the label text shows "Silver II" not just "Silver."

**Step 5 — Update GameOverOverlay near-miss MMR messaging (from QW-06).** Now that `mmrToNextDivision` is in `rankProgress`, the message "34 MMR to Silver II" is easily populated.

**Step 6 — Update ProfilePage, Leaderboard, HUD** anywhere `tierLabel` or `rankLabel` is displayed to show the full "Silver II" label, not just "Silver."

**Step 7 — Tune MMR delta formula.** With smaller tier gaps (60–120 MMR per division vs 500 per tier), the `calculateRoundRankDelta` max of +35 / min of -25 stays reasonable. A division climb still takes several good rounds. Verify this feels right with the new thresholds.

**Files:** `src/utils/rankUtils.js`, `src/components/TierBadge.jsx`, `src/features/game/components/roundOverlays/GameOverOverlay.jsx`, `src/pages/ProfilePage.jsx`, `src/pages/LeaderboardPage.jsx`

**Dependency:** QW-06 (contextual loss copy) benefits from this but can be implemented with the current 3-tier system as an interim.

---

### RET-05 — Daily Challenge

**Priority:** High  
**Effort:** 3–4 hours

The single most powerful driver of daily return rate for skill games. A specific, optional daily goal that resets at midnight.

**Implementation:**

**Step 1 — Define challenge templates in `src/constants/dailyChallenges.js`:**
```js
export const CHALLENGE_TEMPLATES = [
  { id: "streak-10-ranked", description: "Hit a 10-streak in Ranked mode",
    check: (result) => result.modeId === "hard" && result.bestStreak >= 10 },
  { id: "accuracy-90-casual", description: "Finish a Casual round with 90%+ accuracy",
    check: (result) => result.modeId === "normal" && parseInt(result.accuracy) >= 90 },
  { id: "score-2000-ranked", description: "Score 2,000+ in a single Ranked round",
    check: (result) => result.modeId === "hard" && result.score >= 2000 },
  { id: "clean-run-casual", description: "Complete a Casual round with zero misses",
    check: (result) => result.modeId === "normal" && result.misses === 0 },
  { id: "streak-15-any", description: "Hit a 15-streak in any mode",
    check: (result) => result.bestStreak >= 15 },
  { id: "hits-30-ranked", description: "Record 30+ hits in a single Ranked round",
    check: (result) => result.modeId === "hard" && result.hits >= 30 },
  { id: "combo-5-casual", description: "Maintain a combo multiplier for 5+ consecutive hits in Casual",
    check: (result) => result.modeId === "normal" && result.bestStreak >= 5 },
  // Add 10+ more templates for variety
]

// Deterministic challenge selection — same challenge for all players each day
export function getDailyChallenge(dateString = new Date().toISOString().slice(0, 10)) {
  let hash = 0
  for (let i = 0; i < dateString.length; i++) {
    hash = ((hash << 5) - hash) + dateString.charCodeAt(i)
    hash |= 0
  }
  const index = (hash >>> 0) % CHALLENGE_TEMPLATES.length
  return CHALLENGE_TEMPLATES[index]
}
```

**Step 2 — Track daily challenge state in `useAppPlayerState`.** Add a `dailyChallengeState` to localStorage:
```js
{
  date: "2026-04-02",         // ISO date string
  challengeId: "streak-10-ranked",
  completed: false,
}
```

On app load, if `dailyChallengeState.date !== today`, reset `completed` to false and update `date` and `challengeId` from `getDailyChallenge()`.

**Step 3 — Check challenge completion after each round.** In `usePlayerProgressionUpdates.js`'s `handleRoundComplete`, after computing the history entry, check `getDailyChallenge().check(historyEntry)`. If true and not already completed, set `completed: true` and grant a 75-coin bonus.

**Step 4 — Display in ReadyOverlay.** At the bottom of the ReadyOverlay (below the mode cards), add a small "Today's Challenge" strip:
```jsx
<div className="dailyChallengeStrip">
  <span className="dailyChallengeLabel">Today's Challenge</span>
  <span className="dailyChallengeDescription">{dailyChallenge.description}</span>
  {isDailyCompleted ? (
    <span className="dailyChallengeComplete">Complete ✓</span>
  ) : (
    <span className="dailyChallengeMeta">+75 coins</span>
  )}
</div>
```

Pass `dailyChallenge`, `isDailyCompleted` down through GamePage → `useGameScreenController` return value → GamePage render → ReadyOverlay prop.

**Step 5 — Celebrate completion in GameOverOverlay.** If the round just completed the daily challenge, add it to the rewards section: "Daily Challenge Complete — +75 coins."

**Files:** `src/constants/dailyChallenges.js` (new), `src/app/useAppPlayerState.js`, `src/app/usePlayerProgressionUpdates.js`, `src/features/game/components/roundOverlays/ReadyOverlay.jsx`, `src/features/game/components/roundOverlays/GameOverOverlay.jsx`

---

### RET-06 — Atmosphere Tier Made Visible

**Priority:** Medium  
**Effort:** 2 hours

The streak atmosphere tier system (`streakTier0` through `streakTierN`) already shifts the visual mood based on streak. But this escalation is invisible as a system — players don't know it exists, what tier they're in, or that it resets on a miss.

**Implementation:**

**Step 1 — Define tier names.** In `src/utils/gameMath.js`, alongside `getStreakAtmosphereTier`, add tier labels:
```js
const ATMOSPHERE_TIER_LABELS = ["", "Warming Up", "On Fire", "Blazing", "Inferno", "Transcendent"]

export function getAtmosphereTierLabel(tier) {
  return ATMOSPHERE_TIER_LABELS[Math.min(tier, ATMOSPHERE_TIER_LABELS.length - 1)] ?? ""
}
```

**Step 2 — Pass the tier label into GameHud.** Add `atmosphereTierLabel` to `hudProps` in `useGameScreenController`. Show it in GameHud only when tier ≥ 2 (don't show at baseline):
```jsx
{atmosphereTierLabel ? (
  <span className="hudAtmosphereTier">{atmosphereTierLabel}</span>
) : null}
```

Style as a small pulsing label near the streak display. Color matches the tier CSS (firey oranges at high tiers).

**Step 3 — Tier-up visual beat.** When `atmosphereTier` increases (use `useRef` to track previous), trigger a brief arena flash: add a CSS class `atmosphereTierUp` to the game screen for 300ms. This makes the escalation feel like crossing a threshold, not just a gradient shift.

**Step 4 — Tier collapse on miss.** When a miss occurs and tier resets to 0, trigger a distinct `atmosphereTierCollapse` CSS animation — a quick desaturation flash on the arena. This makes losing a high-tier streak feel like something specific was lost, not just a number reset.

**Files:** `src/utils/gameMath.js`, `src/features/game/hooks/useGameScreenController.js`, `src/features/game/components/GameHud.jsx`, `src/styles/components/game.css`

---

### RET-07 — Session Summary on Profile Page

**Priority:** Medium  
**Effort:** 2 hours

Players who can see what they accomplished today are more likely to return tomorrow. A session summary makes a play session feel like a unit with a narrative shape.

**Implementation:**

**Step 1 — Define `buildTodayStats(roundHistory)` in `historyUtils.js`:**
```js
export function buildTodayStats(roundHistory = []) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayRounds = roundHistory.filter((r) => {
    const iso = r.playedAtIso ?? ""
    return iso.startsWith(todayStr)
  })

  if (!todayRounds.length) return null

  let totalXp = 0
  let totalCoins = 0
  let netMmr = 0
  let bestScore = 0
  let bestStreak = 0

  todayRounds.forEach((r) => {
    totalXp += Number(r.xpEarned) || 0
    totalCoins += Number(r.coinsEarned) || 0
    netMmr += Number(r.rankDelta) || 0
    bestScore = Math.max(bestScore, Number(r.score) || 0)
    bestStreak = Math.max(bestStreak, Number(r.bestStreak) || 0)
  })

  return {
    rounds: todayRounds.length,
    totalXp,
    totalCoins,
    netMmr,
    bestScore,
    bestStreak,
  }
}
```

**Step 2 — Display at the top of ProfilePage.** If `todayStats` is non-null, render a "Today's Session" card above the main stat sections:
```jsx
{todayStats ? (
  <section className="profileTodaySession" aria-label="Today's session summary">
    <h2 className="profileTodayTitle">Today's Session</h2>
    <div className="profileTodayGrid">
      <span>{todayStats.rounds} rounds</span>
      <span>+{todayStats.totalXp} XP</span>
      <span>+{todayStats.totalCoins} coins</span>
      {todayStats.netMmr !== 0 ? (
        <span>{todayStats.netMmr > 0 ? "+" : ""}{todayStats.netMmr} MMR</span>
      ) : null}
      <span>Best score: {todayStats.bestScore.toLocaleString()}</span>
    </div>
  </section>
) : null}
```

**Files:** `src/utils/historyUtils.js`, `src/pages/ProfilePage.jsx`, `src/styles/components/profile.css`

---

### RET-08 — MMR Trend Sparkline on Profile

**Priority:** Medium  
**Effort:** 2–3 hours

A trend line of your last 10 ranked MMR values creates emotional momentum: an upward curve produces pride and drive to keep it going; a downward curve produces recovery motivation.

**Implementation:**

**Step 1 — Compute data in ProfilePage:**
```js
const rankedMmrHistory = useMemo(() => {
  return roundHistory
    .filter(isRankedModeEntry)
    .slice(0, 10)
    .reverse() // oldest to newest for left-to-right chart
    .map((r) => Number(r.rankDelta) || 0)
    .reduce((acc, delta) => {
      const last = acc[acc.length - 1] ?? rankProgress.mmr
      acc.push(last - delta) // work backwards from current MMR
      return acc
    }, [])
    // Actually: build from cumulative deltas. Simpler:
    // Filter ranked rounds, extract [{ mmrAfter: computed }]
}, [roundHistory, rankProgress.mmr])
```

Better approach — store cumulative MMR per round. In `historyUtils.js`, `createHistoryEntry` already has `rankDelta`. Compute running total from the end:
```js
const rankedRounds = roundHistory.filter(isRankedModeEntry).slice(0, 10)
const points = [] // build from current MMR backwards
let runningMmr = rankProgress.mmr
for (let i = 0; i < rankedRounds.length; i++) {
  points.unshift(Math.max(0, runningMmr))
  runningMmr -= Number(rankedRounds[i].rankDelta) || 0
}
```

**Step 2 — Render as an SVG sparkline:**
```jsx
function MmrSparkline({ points }) {
  if (points.length < 2) return null
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const width = 160
  const height = 40
  const coords = points.map((val, i) => {
    const x = (i / (points.length - 1)) * width
    const y = height - ((val - min) / range) * height
    return `${x},${y}`
  })
  const polyline = coords.join(" ")
  const isUpward = points[points.length - 1] >= points[0]

  return (
    <svg width={width} height={height} className={`mmrSparkline ${isUpward ? "trending-up" : "trending-down"}`}>
      <polyline points={polyline} fill="none" strokeWidth="2" />
    </svg>
  )
}
```

No library needed. Place in the ProfilePage ranked section alongside the MMR stat card.

**Files:** `src/pages/ProfilePage.jsx`, `src/styles/components/profile.css`

---

## PART 4 — Deep Retention Systems
> Architectural work. These take multiple sessions and require careful design before implementation. Plan independently.

---

### DEEP-01 — Ranked Season System

**Priority:** Very high (long-term)  
**Effort:** 1–2 weeks  
**Dependency:** RET-04 (sub-tiers) should be in place first

Seasons make ranked play infinitely replayable by giving it an arc: a beginning, a climax, and a permanent legacy. "Season 4 Gold" is an identity that cannot be earned again.

**Implementation Plan:**

**Database:**
```sql
CREATE TABLE IF NOT EXISTS `seasons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,       -- "Season 1", "Season 2"
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `is_active` BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS `season_results` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `season_id` INT NOT NULL,
  `peak_mmr` INT DEFAULT 0,
  `final_mmr` INT DEFAULT 0,
  `peak_tier_label` VARCHAR(30),      -- "Gold II"
  `broad_tier_id` VARCHAR(20),        -- "gold" — for badge image
  UNIQUE KEY `user_season` (`user_id`, `season_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`)
);
```

**Backend — Season end job (runs on cron or manually):**
1. For each user with ranked activity this season, write their peak MMR tier to `season_results`.
2. Apply a soft reset: new MMR = `max(Bronze III floor, Math.round(current_mmr * 0.6))`. This drops players by 40% but never below tier entry.
3. Mark the season inactive, create the next season row.

**Backend — API additions:**
- `GET /seasons/active` → returns current season name, end date, and days remaining
- `GET /seasons/results/:userId` → returns array of past season badges

**Frontend — Profile page seasonal showcase:**
```jsx
<section className="profileSeasonBadges" aria-label="Season history">
  <h2>Season History</h2>
  <div className="profileSeasonBadgeGrid">
    {seasonResults.map((season) => (
      <div key={season.seasonId} className={`profileSeasonBadge broad-${season.broadTierId}`}>
        <img src={`/ranks/${season.broadTierId}.png`} alt="" />
        <span className="profileSeasonName">{season.name}</span>
        <span className="profileSeasonTier">{season.peakTierLabel}</span>
      </div>
    ))}
  </div>
</section>
```

**Frontend — Season countdown in ReadyOverlay or ProfilePage:**
Show "Season 4 ends in 8 days" when within 14 days of season end. This creates urgency for casual players to push for a higher finish.

**Frontend — Season transition overlay on first login after reset:**
On the first login of a new season, show a brief overlay: "Season 4 has ended — your Season 4 [Gold II] badge has been added to your profile. Season 5 has begun." Then show the current MMR (post-reset). This makes the transition feel acknowledged rather than jarring.

**Files:** `server/data/` (new migration), `server/db.js`, `src/services/api.js`, `src/pages/ProfilePage.jsx`

---

### DEEP-02 — Title / Badge System

**Priority:** High (long-term)  
**Effort:** 3–5 days  
**Dependency:** RET-03 (level milestones) provides level-based titles

Titles are the lowest-cost identity system available. Players will grind achievements and levels specifically for the title that matches their self-image.

**Implementation Plan:**

**Step 1 — Define all title sources in `src/constants/playerTitles.js`:**
```js
export const TITLE_SOURCES = {
  // From level milestones (level-based, re-derived — no explicit storage needed)
  LEVEL: [
    { level: 5,   title: "Challenger" },
    { level: 10,  title: "Veteran" },
    { level: 20,  title: "Seasoned" },
    { level: 50,  title: "Elite" },
    { level: 100, title: "Centurion" },
  ],
  // From achievement category masters
  ACHIEVEMENT: [
    { achievementId: "rounds-master",   title: "Arena Regular" },
    { achievementId: "streak-master",   title: "Combo Architect" },
    { achievementId: "ranked-master",   title: "Ranked Specialist" },
    { achievementId: "accuracy-master", title: "Sharpshooter" },
    { achievementId: "economy-master",  title: "Coin Baron" },
    { achievementId: "master-of-masters", title: "ClickAway Legend" },
  ],
  // From ranked milestones (derived from current MMR tier)
  RANK: [
    { broadTierId: "silver",   title: "Silver Contender" },
    { broadTierId: "gold",     title: "Gold Contender" },
    { broadTierId: "platinum", title: "Platinum Contender" },
  ],
}
```

**Step 2 — `getEarnedTitles(playerState)` utility:**
```js
export function getEarnedTitles({ level, unlockedAchievementIds, rankBroadTierId }) {
  const titles = []
  TITLE_SOURCES.LEVEL.forEach(({ level: reqLevel, title }) => {
    if (level >= reqLevel) titles.push(title)
  })
  TITLE_SOURCES.ACHIEVEMENT.forEach(({ achievementId, title }) => {
    if (unlockedAchievementIds.includes(achievementId)) titles.push(title)
  })
  TITLE_SOURCES.RANK.forEach(({ broadTierId, title }) => {
    if (rankBroadTierId === broadTierId || /* higher tiers */ ...) titles.push(title)
  })
  return titles
}
```

**Step 3 — Player title selection.** Add `selectedTitle` to `useAppPlayerState` (localStorage-persisted). On Profile page, add a title selector dropdown that shows all earned titles. On change, update `selectedTitle`.

**Step 4 — Display on Profile and Leaderboard.** On ProfilePage hero, below the player name, show the selected title in muted smaller text. On LeaderboardPage rows, add an optional title column or show as subtitle on the current user's highlighted row.

**Step 5 — Persist `selectedTitle` server-side.** Add `selected_title VARCHAR(60)` to the `users` table. Include in `updatePlayerProgress` payload. Show other players' titles on the leaderboard by including it in the leaderboard API response.

**Files:** `src/constants/playerTitles.js` (new), `src/app/useAppPlayerState.js`, `src/pages/ProfilePage.jsx`, `src/pages/LeaderboardPage.jsx`, `server/db.js`

---

### DEEP-03 — Achievement Coin Rewards + Prestige Cosmetics

**Priority:** Medium (long-term)  
**Effort:** 2–3 days  
**Dependency:** Achievement system functioning correctly (targetValue bug should be fixed first)

This closes the loop between achievements (effort) → coins (currency) → cosmetics (identity). Without this loop, the three systems are independent islands.

**Implementation Plan:**

**Step 1 — Add coin rewards to achievement definitions in `achievementsList.js`:**
```js
// Add a coinReward field to metric achievements
{ id: "rounds-10",   ..., coinReward: 25 },
{ id: "rounds-50",   ..., coinReward: 75 },
{ id: "rounds-100",  ..., coinReward: 150 },
// Category master achievements get larger rewards
{ id: "rounds-master", type: "categoryMaster", ..., coinReward: 300 },
{ id: "master-of-masters", type: "masterOfMasters", ..., coinReward: 1000 },
```

**Step 2 — Detect newly unlocked achievements in `useAchievementSync`.** This hook already detects when `unlockedAchievementIdsFromStats` contains IDs not in `unlockedAchievementIds`. When it finds new unlocks, add the coin rewards:
```js
const totalCoinBonus = newlyUnlocked.reduce((sum, id) => {
  const achievement = ACHIEVEMENTS.find((a) => a.id === id)
  return sum + (achievement?.coinReward ?? 0)
}, 0)
if (totalCoinBonus > 0) {
  // Call into a setCoins updater — needs to be passed to useAchievementSync
  setCoins((prev) => prev + totalCoinBonus)
}
```

**Step 3 — Add achievement-locked cosmetics to `shopCatalog.js`.** Add an `unlockCondition` field:
```js
{
  id: "arena-ranked-gold",
  name: "Gold Arena",
  type: "arenaTheme",
  effectClass: "theme-ranked-gold",
  builtIn: false,
  cost: 0,
  unlockCondition: { type: "achievement", achievementId: "ranked-master" },
  description: "Unlocked by completing all Ranked achievements.",
}
```

**Step 4 — Update shop logic.** In `shopUtils.js`, `canPurchaseShopItem` and `isShopItemOwned` should check `unlockCondition`:
- If `item.unlockCondition.type === "achievement"`: owned only if `unlockedAchievementIds.includes(unlockCondition.achievementId)`.
- In the shop UI, show these items in a separate "Achievement Unlocks" section with locked/unlocked state clearly indicated.

**Files:** `src/game/achievements/achievementsList.js`, `src/app/useAchievementSync.js`, `src/constants/shopCatalog.js`, `src/utils/shopUtils.js`, `src/pages/ShopPage.jsx`

---

### DEEP-04 — Leaderboard Cosmetic Visibility

**Priority:** Low (long-term)  
**Effort:** 2–3 days

Cosmetics are visible only to the player themselves. Adding even a small cosmetic signal to leaderboard rows gives cosmetics a social dimension and creates visibility pressure.

**Implementation Plan:**

**Step 1 — Include equipped profile image in leaderboard API response.** The `fetchLeaderboard` endpoint currently returns username, MMR, etc. Add `equippedProfileImageUrl` to the response (the `imageSrc` of the equipped profile image item, or null for the default gradient avatar).

**Step 2 — Render in LeaderboardPage rows.** Add a small avatar column (28×28px) as the first cell of each row:
```jsx
<td className="leaderboardAvatar">
  {player.equippedProfileImageUrl ? (
    <img src={player.equippedProfileImageUrl} alt="" className="leaderboardAvatarImage" />
  ) : (
    <span
      className="leaderboardAvatarInitials"
      style={getProfileAvatarStyle(player.username)}
    >
      {getProfileInitials(player.username)}
    </span>
  )}
</td>
```

**Step 3 — Show equipped button skin color as a subtle indicator.** If the player has a non-default button skin, show a small colored dot or badge next to their name (using the skin's `effectClass` CSS variable if it defines a color). This is optional and can be skipped if it feels cluttered.

**Step 4 — Backend.** Add `equipped_profile_image_id` to the leaderboard query JOIN, resolve the `imageSrc` from shop catalog, and include in response.

**Files:** `server/db.js`, `src/services/api.js`, `src/pages/LeaderboardPage.jsx`, `src/utils/profileAvatar.js`

---

### DEEP-05 — Consolidate Duplicate Logic (Accuracy, Date Formatting)

**Priority:** Medium (long-term cleanup)  
**Effort:** 2–3 hours

Two instances of logic duplication between client and server that should be cleaned up once the architecture settles.

**Accuracy formatting:**  
Server currently returns pre-formatted `"78%"` strings from `formatAccuracy`. Change server to return raw `accuracyPercent: 78` (a number). Remove `formatAccuracy` from `server/db.js`. Client formats using `gameMath.js:formatAccuracy(hits, misses)` where raw data is available, or a new `formatPercent(value)` helper where only the number is available. This also fixes the `parseAccuracyPercent` kludge in `LeaderboardPage.jsx` that parses a string back into a number.

**Date label formatting:**  
Server currently formats "Today, 3:42 PM" style labels via its own `formatPlayedAtLabel`. Remove from `server/db.js`. Server returns `played_at` as ISO string only. Client calls `historyUtils.formatPlayedAtLabel(new Date(entry.playedAtIso))` when rendering.

This requires updating the server's `buildHistoryEntry` return shape and the client's `normalizeRoundHistoryEntry` to derive `playedAt` client-side from `playedAtIso`.

**Files:** `server/db.js`, `src/utils/gameMath.js`, `src/utils/historyUtils.js`, `src/pages/LeaderboardPage.jsx`, `src/components/PlayerHoverCard.jsx`

---

## Priority Summary

| ID | Title | Priority | Effort |
|---|---|---|---|
| FIX-01 | Add untracked files to git | **Blocker** | 5m |
| FIX-02 | Remove dead `difficultyId` field | **High** | 15m |
| FIX-03 | Shared format utils | **High** | 20m |
| FIX-04 | ReadyOverlay hardcoded mode copy | **High** | 45m |
| FIX-05 | Leaderboard profile click stub | **High** | 30m |
| FIX-06 | Standardize achievement ID naming | **Medium** | 20m |
| FIX-07 | Redundant fetchCurrentUser in shop | **Medium** | 30m |
| FIX-08 | Empty state, HoverCard, history strip | **Low** | 1h |
| QW-01 | Rematch button | **Critical** | 1h |
| QW-02 | Near-miss score messaging | **Critical** | 30m |
| QW-03 | Personal best in HUD | **Very high** | 30m |
| QW-04 | Streak record celebration | **High** | 45m |
| QW-05 | XP-to-next-level in overlay | **High** | 20m |
| QW-06 | Contextual loss copy for ranked | **High** | 30m |
| QW-07 | Clean run visual treatment | **Medium** | 20m |
| QW-08 | Cosmetic purchase celebration | **Medium** | 45m |
| RET-01 | Per-round grade (S/A/B/C) | **Very high** | 3h |
| RET-02 | Achievement progress in overlay | **Very high** | 4h |
| RET-03 | Level milestone unlocks | **High** | 4h |
| RET-04 | Ranked sub-tiers (9 divisions) | **High** | 5h |
| RET-05 | Daily challenge | **High** | 4h |
| RET-06 | Atmosphere tier made visible | **Medium** | 2h |
| RET-07 | Session summary on Profile | **Medium** | 2h |
| RET-08 | MMR trend sparkline | **Medium** | 3h |
| DEEP-01 | Ranked season system | **Very high** | 1–2 weeks |
| DEEP-02 | Title / badge system | **High** | 3–5 days |
| DEEP-03 | Achievement coin rewards + prestige cosmetics | **Medium** | 2–3 days |
| DEEP-04 | Leaderboard cosmetic visibility | **Low** | 2–3 days |
| DEEP-05 | Consolidate duplicate logic (server) | **Medium** | 3h |

---

## Execution Order

**Session 1 — Unblock (30 min):** FIX-01, FIX-02, FIX-03, FIX-06

**Session 2 — Structural fixes (2h):** FIX-04, FIX-05, FIX-07, FIX-08

**Session 3 — Quick wins (3–4h):** QW-01 (Rematch), QW-02 (near-miss), QW-03 (PB in HUD), QW-04 (streak record), QW-05 (XP countdown), QW-06 (loss copy), QW-07, QW-08

**Session 4 — Core retention sprint (2 days):** RET-01 (grades), RET-02 (achievement nudges), RET-03 (level milestones), RET-05 (daily challenge)

**Session 5 — Competitive overhaul (2 days):** RET-04 (sub-tiers), RET-06 (atmosphere), RET-07 (session summary), RET-08 (sparkline)

**Sprint — Deep systems (plan carefully before starting):** DEEP-01, DEEP-02, DEEP-03, DEEP-04, DEEP-05
