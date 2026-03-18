import { getShopItemStatus } from "../../../utils/shopUtils.js"

const ITEM_TYPE_LABELS = {
  button_skin: "Button Skin",
  arena_theme: "Arena Theme",
  profile_image: "Profile Image",
}

function getActionState({ isOwned, isEquipped, canAfford }) {
  const label = isOwned
    ? isEquipped
      ? "Equipped"
      : "Equip"
    : canAfford
      ? "Unlock"
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

function getFooterText({ item, isOwned, isEquipped, canAfford }) {
  if (isEquipped) return ""
  if (isOwned) return ""
  if (!canAfford) return ""

  return item.cost === 0 ? "Free unlock" : `${formatCoins(item.cost)} coins`
}

function getActionLabel({ item, isOwned, canAfford, coins, defaultLabel }) {
  if (isOwned || canAfford) return defaultLabel

  const missingCoins = Math.max(0, item.cost - coins)
  return `${formatCoins(missingCoins)} More`
}

function getStateLabel({ isOwned, isEquipped, canAfford }) {
  if (isEquipped) return "Equipped"
  if (isOwned) return "Owned"
  if (!canAfford) return "Locked"
  return "Ready"
}

function getStatusCopy({ item, isOwned, isEquipped, canAfford, coins }) {
  if (isEquipped) return "Active in your current loadout."
  if (isOwned) return "Owned and ready to equip."
  if (canAfford) return item.cost === 0 ? "Built-in cosmetic." : "Unlock available right now."

  const missingCoins = Math.max(0, item.cost - coins)
  return `${formatCoins(missingCoins)} more coins required.`
}

function getPriceLabel({ item }) {
  if (item.builtIn || item.cost === 0) return "Core"
  return `${formatCoins(item.cost)}C`
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
  equippedProfileImageId,
}) {
  const { isOwned, canAfford, isEquipped } = getShopItemStatus({
    item,
    coins,
    ownedItemIds,
    equippedButtonSkinId,
    equippedArenaThemeId,
    equippedProfileImageId,
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
  const actionButtonClassName = `primaryButton shopActionButton ${
    isOwned ? "isEquip" : canAfford ? "isBuy" : "isLocked"
  }`
  const footerText = getFooterText({ item, isOwned, isEquipped, canAfford })
  const actionLabelDisplay = getActionLabel({
    item,
    isOwned,
    canAfford,
    coins,
    defaultLabel: actionLabel,
  })
  const footerClassName = `shopItemFooter ${footerText ? "" : "hasNoMeta"}`
  const stateLabel = getStateLabel({ isOwned, isEquipped, canAfford })
  const statusCopy = getStatusCopy({ item, isOwned, isEquipped, canAfford, coins })
  const priceLabel = getPriceLabel({ item })
  const itemTypeLabel = ITEM_TYPE_LABELS[item.type] ?? "Cosmetic"

  return (
    <article className={cardClassName}>
      <div className="shopItemHeader">
        <div className="shopItemBadgeRow">
          <span className="shopItemTypeTag">{itemTypeLabel}</span>
          <span className={`shopItemStateTag is-${visualState}`}>{stateLabel}</span>
        </div>
        <span className={`shopItemPriceTag ${item.cost === 0 ? "isCore" : ""}`}>{priceLabel}</span>
      </div>

      <div className="shopItemShowcase">
        <div className="shopItemPreviewFrame">
          <div
            className={previewClassName}
            style={getPreviewStyle(item)}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="shopItemInfo">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
      </div>

      <div className={footerClassName}>
        <span className={`shopItemStatusText is-${visualState}`}>
          {footerText || statusCopy}
        </span>
        {isEquipped ? (
          <span className="shopSelectedPill">Selected</span>
        ) : (
          <button
            type="button"
            className={actionButtonClassName}
            onClick={handleAction}
            disabled={isActionDisabled}
          >
            {actionLabelDisplay}
          </button>
        )}
      </div>
    </article>
  )
}
