export const GETTING_STARTED_STEPS = [
  "Log in.",
  "Open Game and check your difficulty.",
  "Press Start Round and wait for the 3-second countdown.",
  "Click the moving target before time hits 0.",
  "Review results, then press Play Again.",
]

export const ROUND_FLOW_POINTS = [
  "Ready: Start now or change difficulty.",
  "Countdown: 3, 2, 1.",
  "Live round: target moves and shrinks.",
  "Miss: streak resets; score may drop.",
  "Game Over: see score and key stats.",
]

export const CONTROLS_ROWS = [
  ["Hit Target", "Left click directly on the moving target."],
  ["Miss", "Left click the arena outside the target."],
  ["Use Time +2s", "Press 1 when charges are available."],
  ["Use Grow +10", "Press 2 when charges are available."],
  ["Use Freeze 1s", "Press 3 when charges are available."],
  ["Change Difficulty", "Round Ready -> Change Difficulty button."],
]

export const NAVIGATION_ROWS = [
  ["Game", "Play rounds and earn coins."],
  ["Shop", "Buy and equip cosmetics."],
  ["History", "See your past rounds."],
  ["Leaderboard", "See rank-style stats from history."],
  ["Help", "Open this guide."],
  ["Logout", "Sign out."],
]

export const DIFFICULTY_ROWS = [
  ["Easy", "200s", "0", "1.00x", "Best for learning."],
  ["Normal", "15s", "1", "1.10x", "Balanced default mode."],
  ["Hard", "12s", "2", "1.25x", "Fast, high-risk mode."],
]

export const SCORING_ROWS = [
  ["Hit", "Gives points. Combo can boost them."],
  ["Miss", "Resets streak. May remove points."],
  ["Combo", "Grows with back-to-back hits."],
  ["Coins", "End of round: floor(hits x coin rate)."],
  ["Best Streak", "Your longest streak that round."],
]

export const POWERUP_ROWS = [
  ["1", "Time +2s", "Every 5 streak", "Adds 2 seconds."],
  ["2", "Grow +10", "Every 10 streak", "Makes target larger."],
  ["3", "Freeze 1s", "Every 15 streak", "Stops movement briefly."],
]

export const SHOP_POINTS = [
  "Two categories: Button Skins and Arena Themes.",
  "Built-in items cost 0.",
  "Buy unowned items with coins.",
  "Owned items can be equipped anytime.",
  "One skin and one theme can be active.",
  "Cosmetics do not change gameplay stats.",
]

export const PERFORMANCE_TIPS = [
  "Accuracy first, speed second.",
  "Protect streaks.",
  "Use Grow when target is tiny.",
  "Save Time +2s for late round.",
  "Use Freeze for precision moments.",
  "Practice on Easy, then move up.",
]

export const PROGRESSION_POINTS = [
  "Coins, owned items, loadout, difficulty, and history are saved locally.",
  "History stores score, hits, misses, streak, difficulty, and coins.",
  "Leaderboard is built from saved history.",
  "Clearing browser storage resets progress.",
]

export const FAQ_ITEMS = [
  {
    question: "What should I do first if I have never played?",
    answer: "Start on Easy for a few rounds, then move to Normal.",
  },
  {
    question: "How do I earn coins quickly?",
    answer: "Land more hits, keep streaks, and use higher coin-rate difficulties when ready.",
  },
  {
    question: "Do I lose coins on misses?",
    answer: "No. Coins are only spent in Shop.",
  },
  {
    question: "Can I change cosmetics whenever I want?",
    answer: "Yes. Once an item is owned, you can equip it again at any time from Shop.",
  },
  {
    question: "Why does my data look reset?",
    answer: "Progress is local. Clearing site data resets it.",
  },
  {
    question: "Does Help reflect all current systems?",
    answer: "Yes. It covers gameplay, controls, difficulty, power-ups, shop, and progress.",
  },
]
