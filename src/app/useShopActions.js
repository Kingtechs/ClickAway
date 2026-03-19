import { useCallback } from "react"

import { equipShopItem, purchaseShopItem } from "../services/api.js"
import { canPurchaseShopItem, isShopItemOwned } from "../utils/shopUtils.js"

export function useShopActions({
  authToken,
  playerUsername,
  setPlayerUsername,
  coins,
  ownedItemIds,
  applyPlayerState,
}) {
  const handlePurchase = useCallback(async (item) => {
    const canPurchase = canPurchaseShopItem(item, coins, ownedItemIds)
    if (!canPurchase || !authToken) {
      return {
        ok: false,
        error: `Could not unlock ${item?.name || "that item"}.`,
      }
    }

    try {
      const playerStateResponse = await purchaseShopItem(authToken, item.id)
      setPlayerUsername(playerStateResponse.user.username || playerUsername)
      applyPlayerState(playerStateResponse.state)
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        error: error.message || `Could not unlock ${item.name}.`,
      }
    }
  }, [
    applyPlayerState,
    authToken,
    coins,
    ownedItemIds,
    playerUsername,
    setPlayerUsername,
  ])

  const handleEquip = useCallback(async (item) => {
    if (!item?.id || !item.type || !authToken || !isShopItemOwned(item, ownedItemIds)) {
      return {
        ok: false,
        error: `Could not equip ${item?.name || "that item"}.`,
      }
    }

    try {
      const playerStateResponse = await equipShopItem(authToken, item.id)
      setPlayerUsername(playerStateResponse.user.username || playerUsername)
      applyPlayerState(playerStateResponse.state)
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        error: error.message || `Could not equip ${item.name}.`,
      }
    }
  }, [
    applyPlayerState,
    authToken,
    ownedItemIds,
    playerUsername,
    setPlayerUsername,
  ])

  return {
    handlePurchase,
    handleEquip,
  }
}
