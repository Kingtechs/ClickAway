import { useCallback } from "react"

import { submitRound } from "../services/api.js"

export function usePlayerProgressionUpdates({
  authToken,
  applyProgress,
}) {
  const handleRoundComplete = useCallback(
    async (roundResult = {}) => {
      const {
        modeId = "",
        hits = 0,
        misses = 0,
        score = 0,
        bestStreak = 0,
      } = roundResult

      if (!authToken) return

      try {
        const response = await submitRound(authToken, {
          modeId,
          hits,
          misses,
          score,
          bestStreak,
        })
        applyProgress(response.progress)
      } catch (error) {
        console.error("Unable to submit round:", error)
      }
    },
    [authToken, applyProgress]
  )

  return {
    handleRoundComplete,
  }
}
