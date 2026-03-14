# ClickAway

## Setup
1. Clone the repo:
- `git clone https://github.com/QuinOG/ClickAway.git`
- `cd ClickAway`

2. Install dependencies:
- `npm install`

3. Copy `.env.example` to `.env`

4. Update `.env`
- `JWT_SECRET` is required for the Express auth server.
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` are optional. If `ADMIN_PASSWORD` is empty, admin seeding is skipped.
- `PORT`, `CLIENT_ORIGIN`, and `VITE_API_BASE_URL` already match the local dev defaults.

5. Start the React frontend and Express backend together:
- `npm run dev:all`

6. Open the app:
- `http://localhost:5173`

You can also run the servers separately:
- `npm run server`
- `npm run dev`

Backend health check:
- `http://localhost:4000/api/health`

Create a production build:
- `npm run build`

## Backend Auth Setup
1. Copy `.env.example` to `.env`
2. Set `JWT_SECRET` and `ADMIN_PASSWORD`
3. Start backend:
- `npm run server`

You can run frontend + backend together with:
- `npm run dev:all`

## Project Structure
- `src/components`: reusable UI components used by multiple pages.
- `src/features`: feature-focused UI/content (game/help/shop/history/leaderboard pieces).
- `src/hooks`: simple custom hooks (`useLocalStorageState`, `useBodyClass`).
- `src/utils`: pure helper functions (math, storage parsing, rewards, shop helpers).
- `src/constants`: app config and enum-like values (difficulty, powerups, shop catalog).
- `src/styles`: shared CSS (`app.css`).

## How The Game Loop Works
1. `GamePage` starts in `ROUND_PHASE.READY`.
2. `ReadyOverlay` lets the player select difficulty and start the round.
3. On start, phase changes to `COUNTDOWN` and ticks down each second.
4. When countdown reaches 0, phase changes to `PLAYING`.
5. During play:
- target hits increase score/streak and can award power-up charges.
- misses reset streak and may apply a score penalty (based on difficulty).
- timer ticks down each second.
6. When timer reaches 0, phase changes to `GAME_OVER`.
7. `onRoundComplete` is called once for coin rewards, then the player can play again.

## Where To Change Difficulty Settings
- Edit `src/constants/difficultyConfig.js`.
- Each difficulty object controls:
- `durationSeconds`
- `initialButtonSize`
- `minButtonSize`
- `shrinkFactor`
- `missPenalty`
- `comboStep`
- `coinMultiplier`

## How UI State Flows
1. `App.jsx` owns global UI state:
- auth
- coins
- owned/equipped cosmetics
- selected difficulty
2. Global state is persisted through `useLocalStorageState`.
3. `App.jsx` passes state and callbacks down through route components.
4. `GamePage` owns round-local state:
- phase/timer
- score/streak/accuracy inputs
- powerup charges/usage
- target position/size and click feedback
5. `GamePage` sends round results up through `onRoundComplete`.

## Notes For Beginners
- Keep utility functions in `src/utils` pure (no DOM reads/writes).
- Keep constants in `src/constants` so balancing changes are easy and safe.
- Prefer small components that only render UI and receive data via props.
