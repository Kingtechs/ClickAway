import { useEffect } from "react"

import { mergeUnlockedAchievementIds } from "./appAccountStateHelpers.js"

export function useAchievementSync({
  unlockedAchievementIds,
  setUnlockedAchievementIds,
  unlockedAchievementIdsFromStats,
  persistProgress,
}) {
  useEffect(() => {
    const mergedIds = mergeUnlockedAchievementIds(
      unlockedAchievementIds,
      unlockedAchievementIdsFromStats
    )

    if (mergedIds === unlockedAchievementIds) {
      return
    }

    setUnlockedAchievementIds(mergedIds)
    void persistProgress({
      unlockedAchievementIds: mergedIds,
    })
  }, [
    persistProgress,
    setUnlockedAchievementIds,
    unlockedAchievementIds,
    unlockedAchievementIdsFromStats,
  ])
}
