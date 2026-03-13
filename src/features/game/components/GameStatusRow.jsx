export default function GameStatusRow({ streak, comboMultiplier, bestStreak }) {
  return (
    <div className="gameStatusRow" aria-label="Live round stats">
      <div className="statusBar" aria-live="polite">
        <div className="statusBarItem">
          <span className="statusBarLabel">Streak</span>
          <span className="statusBarValue">{streak}</span>
        </div>
        <div className="statusBarItem">
          <span className="statusBarLabel">Combo</span>
          <span className="statusBarValue">x{comboMultiplier}</span>
        </div>
        <div className="statusBarItem">
          <span className="statusBarLabel">Best</span>
          <span className="statusBarValue">{bestStreak}</span>
        </div>
      </div>
    </div>
  )
}
