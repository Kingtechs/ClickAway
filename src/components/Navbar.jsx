import { NavLink } from "react-router-dom"

const AUTHED_NAV_LINKS = [
  { to: "/game", label: "Game" },
  { to: "/history", label: "History" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/shop", label: "Shop" },
  { to: "/help", label: "Help" },
]

const GUEST_NAV_LINKS = [
  { to: "/login", label: "Login" },
  { to: "/signup", label: "Sign Up" },
]

function renderNavLink({ to, label }) {
  return (
    <NavLink key={to} to={to} className={({ isActive }) => `navItem ${isActive ? "active" : ""}`}>
      {label}
    </NavLink>
  )
}

function NavigationLinks({ links, className }) {
  return <div className={className}>{links.map(renderNavLink)}</div>
}

function CoinVault({ coins }) {
  const formattedCoins = Number.isFinite(coins) ? coins.toLocaleString() : "0"

  return (
    <div className="coinPill" aria-label={`Coin vault ${formattedCoins}`}>
      <span className="coinPillLabel">¢ Coin Vault:</span>
      <span className="coinPillValue">{formattedCoins}</span>
    </div>
  )
}

function LevelPill({ level }) {
  const normalizedLevel = Number.isFinite(level) ? Math.max(1, level) : 1

  return (
    <div className="levelPill" aria-label={`XP level ${normalizedLevel}`}>
      <span className="levelPillLabel">XP Level</span>
      <span className="levelPillValue">{normalizedLevel}</span>
    </div>
  )
}

function getRankImageSrc(rankLabel = "") {
  const normalizedLabel = String(rankLabel).trim().toLowerCase()
  return `/ranks/${normalizedLabel}.png`
}

function RankPill({ rankLabel, rankMmr }) {
  const displayLabel = rankLabel || "Bronze"
  const displayMmr = Number.isFinite(rankMmr) ? Math.max(0, rankMmr) : 0
  const rankImageSrc = getRankImageSrc(displayLabel)

  return (
    <div className="rankPill" aria-label={`Competitve rank ${displayLabel} ${displayMmr} MMR`}>
      <span className="rankPillIconSlot" aria-hidden="true">
        <img
          className="rankPillIcon"
          src={rankImageSrc}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = "none"
          }}
        />
      </span>
      <span className="rankPillText">
        <span className="rankPillLabel">Competitve Rank</span>
        <span className="rankPillValue">{displayLabel} · {displayMmr}</span>
      </span>
    </div>
  )
}

export default function Navbar({
  isAuthed,
  onLogout,
  coins = 0,
  level = 1,
  rankLabel = "Bronze",
  rankMmr = 1000,
}) {
  function handleLogout() {
    // App-level state owns auth; this callback keeps navbar behavior in sync with route guards.
    onLogout?.()
  }

  return (
    <header className="topbar">
      <div className="topbarInner">
        <div className="brandCluster">
          {/* Replace the image path below when your final logo asset is ready. */}
          <div className="brandLogoPlaceholder" aria-label="Logo placeholder">
            <img className="brandLogoImage" src="/pointerimage.png" alt="ClickAway logo" />
          </div>
          <div className="brandText">
            <div className="brand">ClickAway</div>
            <div className="brandTag">Reflex Arena</div>
          </div>
        </div>

        <nav className="navRail" aria-label="Primary navigation">
          {/* Keep nav options auth-aware so route access and UX stay consistent. */}
          {isAuthed ? (
            <>
              <NavigationLinks links={AUTHED_NAV_LINKS} className="navMain" />

              <div className="navMeta">
                <CoinVault coins={coins} />
                <LevelPill level={level} />
                <RankPill rankLabel={rankLabel} rankMmr={rankMmr} />
                <button className="navButton" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <NavigationLinks links={GUEST_NAV_LINKS} className="navMain navMainGuest" />
          )}
        </nav>
      </div>
    </header>
  )
}
