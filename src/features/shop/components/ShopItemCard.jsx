import { getShopItemStatus } from "../../../utils/shopUtils.js"

function getActionState({ isOwned, isEquipped, canAfford }) {
  const label = isOwned
    ? isEquipped
      ? "Equipped"
      : "Equip"
    : canAfford
      ? "Buy"
      : "Need Coins"
  const isDisabled = isOwned ? isEquipped : !canAfford

  return { label, isDisabled }
}

function getVisualState({ isOwned, isEquipped, canAfford }) {
  if (isEquipped) return "equipped"
  if (isOwned) return "owned"
  if (!canAfford) return "locked"
  return "available"
}

function formatCoins(value) {
  return Number.isFinite(value) ? value.toLocaleString() : "0"
}

function getFooterText({ item, isOwned, isEquipped, canAfford, coins }) {
  if (isEquipped) return ""
  if (isOwned) return ""
  if (!canAfford) return ""

  return item.cost === 0 ? "Free unlock" : `${formatCoins(item.cost)} coins`
}

function getActionLabel({ item, isOwned, canAfford, coins, defaultLabel }) {
  if (isOwned || canAfford) return defaultLabel

  const missingCoins = Math.max(0, item.cost - coins)
  return `${formatCoins(missingCoins)+" Coins Needed"}`
}

function getPreviewStyle(item) {
  if (!item.imageSrc) return undefined

  return {
    backgroundImage: `url(${item.imageSrc})`,
    backgroundSize: `${item.shopImageScale ?? item.imageScale ?? 100}%`,
  }
}

export default function ShopItemCard({
  item,
  coins,
  ownedItemIds,
  onPurchase,
  onEquip,
  equippedButtonSkinId,
  equippedArenaThemeId,
}) {
  const { isOwned, canAfford, isEquipped } = getShopItemStatus({
    item,
    coins,
    ownedItemIds,
    equippedButtonSkinId,
    equippedArenaThemeId,
  })

  const { label: actionLabel, isDisabled: isActionDisabled } = getActionState({
    isOwned,
    isEquipped,
    canAfford,
  })
  const visualState = getVisualState({ isOwned, isEquipped, canAfford })

  function handleAction() {
    if (isOwned) {
      onEquip?.(item)
      return
    }

    onPurchase?.(item)
  }

  const hasImage = Boolean(item.imageSrc)
  const previewClassName = `shopPreview ${hasImage ? "" : item.effectClass} ${hasImage ? "hasImage" : ""}`
  const cardClassName = `shopItemCard shopItemCard-${visualState}`
  const actionButtonClassName = `primaryButton shopActionButton ${isOwned ? "isEquip" : "isBuy"}`
  const footerText = getFooterText({ item, isOwned, isEquipped, canAfford, coins })
  const actionLabelDisplay = getActionLabel({
    item,
    isOwned,
    canAfford,
    coins,
    defaultLabel: actionLabel,
  })
  const footerClassName = `shopItemFooter ${footerText ? "" : "hasNoMeta"}`

  return (
    <article className={cardClassName}>
      <div className="shopItemTop">
        <div
          className={previewClassName}
          style={getPreviewStyle(item)}
          aria-hidden="true"
        />

        <div className="shopItemInfo">
          <h3>{item.name}</h3>
          <p>{item.description}</p>
        </div>
      </div>

      <div className={footerClassName}>
        {footerText ? <span className="shopCost">{footerText}</span> : null}
        {isEquipped ? (
          <span className="shopSelectedPill">Selected</span>
        ) : (
          <button className={actionButtonClassName} onClick={handleAction} disabled={isActionDisabled}>
            {actionLabelDisplay}
          </button>
        )}
      </div>
    </article>
  )
}
