# Clickaway — Claude Code Review
**Reviewed:** March 2026 | **Codebase:** React 19 + Vite | **Reviewer:** Claude Sonnet 4.6

---

> **How to read this document:**
> Each suggestion has a **Priority** (🔴 High / 🟡 Medium / 🟢 Low), a plain-English explanation of what's wrong, why it matters, and exactly what needs to be done to fix it. Start with the red items first.

---

## ~~1. 🔴 The "Personal Best" badge on the game-over screen never shows up~~ ✅ Done

~~**What's wrong:**
When a round ends, there is a badge in the results screen that should light up and say "New Personal Best!" — but it is permanently invisible. The code that *displays* the badge is there, but the part of the app that *sends* the badge information to that screen was never wired up.~~

~~**Why it matters:**
This is a core piece of game feel. Players should get a satisfying moment when they beat their own score.~~

~~**Action plan:**
1. Open `src/App.jsx`.
2. Find where `onRoundComplete` is called and where `roundHistory` is updated.
3. Before updating history, calculate the previous best score from the existing history.
4. Pass `bestScore` and `isNewBestScore` as props into `GameOverOverlay`.~~

---

## ~~2. 🔴 The game HUD (score/timer bar) never shows the current mode or rank~~ ✅ Done

~~**What's wrong:**
During a game, the header bar receives two pieces of information — the mode name (e.g., "Ranked") and the player's current rank label (e.g., "Gold") — but it never actually displays them anywhere on screen. The data arrives but gets silently ignored.~~

~~**Why it matters:**
Players have no visual reminder of which mode they are in while playing.~~

~~**Action plan:**
1. Open `src/features/game/components/GameHud.jsx`.
2. Find where `modeLabel` and `rankLabel` are listed as incoming props (around line 12).
3. Add two small text elements to the JSX that render these values, positioned in the HUD.~~

---

## 3. 🔴 Every player has the exact same avatar color

**What's wrong:**
Avatars are supposed to generate a unique color/gradient per player based on their username. Instead, every single player — no matter who they are — gets the same red gradient. The function that should pick a unique color ignores the username it is given.

**Why it matters:**
Avatars feel generic and players can't visually distinguish themselves or others.

**Action plan:**
1. Open `src/utils/profileAvatar.js`.
2. The function `getProfileAvatarStyle` currently returns a hardcoded color. Replace the logic to use the `seedText` parameter (the username) to deterministically pick a color from a palette (e.g., hash the first character to an index in an array of colors).

---

## 4. 🔴 The same number-formatting code is copy-pasted in 4+ different places

**What's wrong:**
There is a small function called `formatNumber` (which adds commas to large numbers, like turning `12345` into `12,345`) that has been written out separately in at least four different files: the Profile page, the Leaderboard page, the Game Over screen, and the Player Hover Card. If you ever want to change how numbers are formatted, you'd have to update all four places and might miss one.

**Why it matters:**
This is the classic "if you change one, you have to change them all" problem. It's easy to create inconsistencies.

**Action plan:**
1. Create a new file: `src/utils/numberFormatting.js`.
2. Write `formatNumber` once in that file and export it.
3. Delete the copies from the four pages and replace them with an `import` from the new file.

---

## 5. 🔴 The History page is missing a summary strip at the top

**What's wrong:**
The History page shows a table of individual past rounds, but there is no summary at the top showing totals like: "Total Rounds Played: 47 | Total XP Earned: 12,400 | Best Score Ever: 3,200". The data needed to calculate these numbers is already available — it just hasn't been built into the page.

**Why it matters:**
Players want to see their cumulative progress at a glance without scrolling through every row.

**Action plan:**
1. Open `src/pages/HistoryPage.jsx`.
2. Add a `useMemo` at the top that loops through `roundHistory` to total up: rounds played, total coins earned, total XP earned, and best single-round score.
3. Render these four numbers in a styled strip above the table.

---

## 6. 🟡 The accuracy calculation logic is duplicated in 5 different files

**What's wrong:**
The formula for calculating accuracy (hits ÷ total attempts × 100) is written out separately in five different files. These files include the Profile page, Leaderboard page, Player Hover Card, and two utility files.

**Why it matters:**
If the accuracy formula ever needs to change — or if one copy has a subtle bug — you'd need to track down and fix all five versions.

**Action plan:**
1. Create `src/utils/accuracyUtils.js`.
2. Move the canonical accuracy calculation there and export it.
3. Replace the five duplicate implementations with imports.

---

## 7. 🟡 The Leaderboard page contains duplicated data-loading logic

**What's wrong:**
The function that loads and assembles the leaderboard data is written out twice in the same file — once as a standalone function and again copy-pasted inside a `useEffect` (which is the React hook that runs code when the page loads). This means there are two places to update if the logic ever needs to change.

**Why it matters:**
Duplicate logic leads to inconsistencies and makes future changes riskier.

**Action plan:**
1. Open `src/pages/LeaderboardPage.jsx`.
2. Remove the duplicate logic inside the `useEffect` (around lines 163–189).
3. Replace it with a call to the already-defined `loadLeaderboard` function.

---

## 8. 🟡 The mode carousel on the Ready screen has text/labels defined twice

**What's wrong:**
The names and descriptions of game modes (Practice, Casual, Ranked) are defined in a central configuration file (`src/constants/difficultyConfig.js`), but the Ready screen also has its own separate copy of these names written directly into it. If you ever rename a mode in the config, the Ready screen won't update automatically.

**Why it matters:**
Data in two places is data that can fall out of sync.

**Action plan:**
1. Open `src/features/game/components/roundOverlays/ReadyOverlay.jsx`.
2. Find the `MODE_ORDER` and `MODE_COPY` constants at the top of the file (around lines 6–28).
3. Replace them with imported values from `difficultyConfig.js`.

---

## 9. 🟡 The "Rounds Played" stat is missing from the player hover card

**What's wrong:**
When you hover over a player's name on the leaderboard, a small card pops up showing their stats. It shows Coin Vault, XP Level, and Accuracy — but it doesn't show how many rounds they've played, which is a fundamental stat.

**Why it matters:**
"Rounds Played" gives important context. A player with 1 round and 90% accuracy is very different from one with 500 rounds.

**Action plan:**
1. Open `src/components/PlayerHoverCard.jsx`.
2. Add a fourth stat row that reads the `roundsPlayed` value from the player data object and displays it.

---

## 10. 🟡 There is no "Rematch" button on the game-over screen

**What's wrong:**
After a round ends, if you want to play again in the same mode, you must click "Play Again" and then navigate through the mode carousel again before starting. There is no button that says "Same Mode Again" to skip directly to a new round.

**Why it matters:**
This adds unnecessary friction for players who want to keep grinding in one mode.

**Action plan:**
1. Open `src/features/game/components/roundOverlays/GameOverOverlay.jsx`.
2. Add a second button (e.g., "Play Again") that calls `onPlayAgain` but passes the current mode directly, bypassing the carousel.
3. Rename the existing "Play Again" button to "Change Mode" or "Back to Menu" for clarity.

---

## 11. 🟡 A deprecated/removed CSS file is still in the project

**What's wrong:**
There is a CSS file called `_deprecated.css` in the styles folder. A comment inside it says the styles are unused and were "kept for safe rollback." This file is dead weight — it adds to the app's size without doing anything useful.

**Why it matters:**
Dead code adds confusion ("is this used somewhere?") and tiny performance overhead.

**Action plan:**
1. Open `src/styles/_deprecated.css`.
2. Verify that none of the class names inside it are referenced anywhere in the codebase (use a text search).
3. If confirmed unused, delete the file entirely. The "safe rollback" purpose is already served by git history.

---

## 12. 🟡 There is a potential divide-by-zero crash in the powerup system

**What's wrong:**
The PowerupTray component calculates how full the progress bar is by dividing the current streak by the number of hits required for the next powerup. If that "hits required" number ever became 0 (even by accident during development), the game would crash or behave erratically.

**Why it matters:**
The current config has hardcoded safe values, so this won't crash right now — but it's a landmine waiting to go off if config values are ever edited.

**Action plan:**
1. Open `src/features/game/components/PowerupTray.jsx`.
2. Find the line that divides streak by `powerup.awardEvery`.
3. Add a guard: change it to use `Math.max(1, powerup.awardEvery)` to prevent division by zero.

---

## 13. 🟡 The XP level-up progress on the game-over screen may show text instead of a bar

**What's wrong:**
The game-over screen should show a visual animated bar showing how much XP you gained and how close you are to the next level. In some code paths, it may display a raw text string (like `"1450/2000 XP"`) instead of the visual bar, which is less engaging and harder to read at a glance.

**Why it matters:**
The animated XP bar is a core feedback loop — it should always be visible and correct.

**Action plan:**
1. Open `src/features/game/components/roundOverlays/GameOverOverlay.jsx`.
2. Locate the section around lines 287–304 where XP progress is rendered.
3. Confirm the `GameOverXpProgress` component (the bar) is always rendered. If there is any code path that renders plain text instead, replace it with the bar component.

---

## 14. 🟡 The `axios` library is installed but not directly used

**What's wrong:**
The project's dependency list (`package.json`) includes `axios`, a library for making network requests. It is only used indirectly through a configuration wrapper file. This is fine technically, but the dependency appears "orphaned" if someone reads the package list.

**Why it matters:**
Minor — but unused or unclear dependencies make it harder for future developers to understand what the project actually needs.

**Action plan:**
1. Open `package.json` and find `axios` in the dependencies list.
2. Add a comment in `src/services/api.js` clarifying that axios is used here, so it's clear why it's installed.
3. Alternatively, if the project is fully client-side with no API calls, consider removing it entirely.

---

## 15. 🟡 Function and variable names use inconsistent conventions

**What's wrong:**
Helper functions across the codebase use different naming patterns: some start with `build` (e.g., `buildXpAnimationPlan`), some with `get` (e.g., `getProfileAvatarStyle`), and some with `create`. There is no consistent rule for which prefix to use when.

**Why it matters:**
When naming is inconsistent, it's harder to search for functions, predict where to find something, and understand at a glance what a function does.

**Action plan:**
1. Agree on a convention: use `build` when creating a new complex object, `get` when retrieving or computing a simple value, and `create` only for factory functions that make UI elements.
2. Do a find-and-replace pass to rename functions that violate the rule. This doesn't change behavior — just names.

---

## 16. 🟢 The achievements system has a data bug: all target values are set to 1

**What's wrong:**
The achievements system tracks milestones like "Play 10 Ranked Rounds" or "Earn 1,000 Coins." But the actual target number for every achievement is currently hardcoded as `1`. This means every achievement unlocks after just one action, regardless of what the badge description says.

**Why it matters:**
Achievement progression is broken — badges that should require effort are handed out instantly.

**Action plan:**
1. Open the achievements definition files in `src/game/achievements/`.
2. Find every instance of `targetValue: 1` and replace it with the correct target number that matches the achievement's description.

---

## 17. 🟢 The "Freeze" powerup timer should use a more reliable clock

**What's wrong:**
The Freeze powerup (which pauses button movement for 1 second) stores its end time using `Date.now()`, which reads the computer's system clock. In rare cases — like if the system clock is adjusted while playing — this could cause the freeze to last the wrong amount of time.

**Why it matters:**
This is a low-risk edge case, but there is a better built-in tool for this: `performance.now()`, which measures time elapsed from when the page loaded and cannot be skewed by clock changes.

**Action plan:**
1. Open `src/features/game/hooks/useGameScreenController.js`.
2. Find the line (around line 335) that sets the freeze end time using `Date.now()`.
3. Replace `Date.now()` with `performance.now()` and ensure all comparisons use `performance.now()` as well.

---

## 18. 🟢 Keyboard users cannot access the player hover card on the leaderboard

**What's wrong:**
The small info card that appears when you hover over a player's row on the leaderboard is only triggered by mouse hover. Keyboard users (and screen reader users) have no way to access this information.

**Why it matters:**
Basic accessibility — the app should be usable without a mouse.

**Action plan:**
1. Open `src/pages/LeaderboardPage.jsx`.
2. Find where the `onMouseEnter` event shows the hover card.
3. Add an `onFocus` event to the same element so it also triggers when the row is focused via keyboard Tab navigation.

---

## 19. 🟢 There are no comments explaining why certain "Ref" patterns are used

**What's wrong:**
The app uses special React patterns (called "refs") in a few critical places — for example, `hasAwardedRoundRef` (which prevents rewards from being given twice) and `progressSnapshotRef` (which captures a moment-in-time copy of the player's progress). These refs exist for specific, non-obvious reasons, but there are no code comments explaining why they exist or what problem they solve.

**Why it matters:**
Without comments, future developers (including future-you) will wonder "why is this a ref and not regular state?" and might accidentally remove them, causing subtle bugs.

**Action plan:**
1. Open `src/App.jsx` and find `progressSnapshotRef`. Add a one-line comment above it explaining it prevents stale-state issues when calculating round rewards.
2. Open `src/features/game/hooks/useGameScreenController.js` and find `hasAwardedRoundRef`. Add a comment: "Ref (not state) to prevent double-firing onRoundComplete on re-renders."

---

## 20. 🟢 There are no automated tests for any of the math/calculation utilities

**What's wrong:**
The game has several complex calculation functions — XP earned per round, rank MMR delta, accuracy bonus, coin multiplier — but none of them have automated tests. This means that if someone changes one formula, there is no safety net to catch whether the change accidentally broke something else.

**Why it matters:**
Math bugs in games are subtle and hard to catch by manual playtesting. A test suite would catch regressions instantly.

**Action plan:**
1. Install Vitest (the standard test runner for Vite projects): `npm install -D vitest`.
2. Create a `src/utils/__tests__/` folder.
3. Start with the most critical utility: `gameMath.js`. Write 3–5 test cases for `calculateScore`, `calculateXp`, and `calculateRankDelta` using known inputs and expected outputs.
4. Add `"test": "vitest"` to the `scripts` section of `package.json`.

---

## Priority Summary

| # | Suggestion | Priority | Effort |
|---|-----------|----------|--------|
| 1 | Wire up "Personal Best" badge | 🔴 High | Small |
| 2 | Display mode & rank label in GameHud | 🔴 High | Small |
| 3 | Fix avatar color generation | 🔴 High | Small |
| 4 | Consolidate `formatNumber` utility | 🔴 High | Small |
| 5 | Add History page summary strip | 🔴 High | Medium |
| 6 | Consolidate accuracy utility | 🟡 Medium | Small |
| 7 | Fix duplicate leaderboard load logic | 🟡 Medium | Small |
| 8 | Import mode names from config | 🟡 Medium | Small |
| 9 | Add "Rounds Played" to hover card | 🟡 Medium | Small |
| 10 | Add "Rematch" button to game-over screen | 🟡 Medium | Medium |
| 11 | Delete deprecated CSS file | 🟡 Medium | Tiny |
| 12 | Guard against divide-by-zero in PowerupTray | 🟡 Medium | Tiny |
| 13 | Verify XP bar always renders | 🟡 Medium | Small |
| 14 | Clarify or remove axios dependency | 🟡 Medium | Tiny |
| 15 | Standardize function naming conventions | 🟡 Medium | Medium |
| 16 | Fix achievement target values | 🟢 Low | Small |
| 17 | Use `performance.now()` for freeze timer | 🟢 Low | Tiny |
| 18 | Add keyboard support to leaderboard hover card | 🟢 Low | Small |
| 19 | Add code comments to Ref patterns | 🟢 Low | Tiny |
| 20 | Add automated tests for math utilities | 🟢 Low | Large |

---

*Generated by Claude Sonnet 4.6 — Clickaway Code Review, March 2026*
