import { Suspense } from "react"
import { Toaster } from "react-hot-toast"
import { Outlet, useLocation } from "react-router-dom"
import Navbar from "./Navbar.jsx"
import { useBodyClass } from "../hooks/useBodyClass.js"

const GAME_ROUTE_PREFIX = "/game"
const GAME_ROUTE_BODY_CLASS = "gameRouteActive"
const ARMORY_ROUTE_PREFIX = "/armory"
const ARMORY_ROUTE_BODY_CLASS = "armoryRouteActive"

function RouteFallback() {
  return (
    <div className="routeFallback" aria-busy="true" aria-live="polite">
      <span className="routeFallbackText">Loading…</span>
    </div>
  )
}

const TOAST_STYLE = {
  background: "rgba(11, 18, 36, 0.97)",
  color: "#ddeeff",
  border: "1px solid rgba(74, 168, 255, 0.28)",
  borderRadius: "12px",
  fontSize: "13px",
  fontFamily: "inherit",
  fontWeight: 600,
  padding: "10px 14px",
  boxShadow: "0 12px 28px rgba(4, 8, 20, 0.52)",
}

export default function Layout({
  isAuthed,
  coins,
  level,
  accuracyPercent,
  rankProgress,
  rankLabel,
  rankMmr,
}) {
  const { pathname } = useLocation()
  const isGameRoute = pathname.startsWith(GAME_ROUTE_PREFIX)
  const isArmoryRoute = pathname.startsWith(ARMORY_ROUTE_PREFIX)

  useBodyClass(GAME_ROUTE_BODY_CLASS, isGameRoute)
  useBodyClass(ARMORY_ROUTE_BODY_CLASS, isArmoryRoute)

  return (
    <div className="appShell">
      <Navbar
        isArmoryRoute={isArmoryRoute}
        isAuthed={isAuthed}
        coins={coins}
        level={level}
        accuracyPercent={accuracyPercent}
        rankProgress={rankProgress}
        rankLabel={rankLabel}
        rankMmr={rankMmr}
      />
      <main
        className={`mainContent ${isGameRoute ? "gameMain" : ""} ${isArmoryRoute ? "armoryMain" : ""}`.trim()}
      >
        {/* key={pathname}: new route remounts this wrapper so only the incoming page animates in (no exit stack / double intro). */}
        <div key={pathname} className="routeOutlet">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={{
          duration: 2800,
          style: TOAST_STYLE,
          success: {
            iconTheme: { primary: "#53d7b3", secondary: "#081a14" },
          },
          error: {
            iconTheme: { primary: "#ff6a75", secondary: "#1a0808" },
          },
        }}
      />
    </div>
  )
}
