function formatCoins(value) {
  return Number.isFinite(value) ? value.toLocaleString() : "0"
}

function getTargetSummary(nextUnlockTarget) {
  if (!nextUnlockTarget?.item) {
    return {
      label: "Collection Complete",
      value: "All cosmetics secured",
      detail: "Every item is already in your inventory.",
    }
  }

  if (nextUnlockTarget.isAffordable) {
    return {
      label: "Ready To Unlock",
      value: nextUnlockTarget.item.name,
      detail: `${formatCoins(nextUnlockTarget.item.cost)} coins to unlock now.`,
    }
  }

  return {
    label: "Next Target",
    value: nextUnlockTarget.item.name,
    detail: `${formatCoins(nextUnlockTarget.missingCoins)} more coins needed.`,
  }
}

export default function ShopStatusHud({
  coins = 0,
  totalOwnedCount = 0,
  totalItems = 0,
  collectionPercent = 0,
  affordableCount = 0,
  nextUnlockTarget = null,
}) {
  const targetSummary = getTargetSummary(nextUnlockTarget)

  return (
    <section className="shopStatusHud" aria-label="Armory progression status">
      <div className="shopHudStat shopHudStat-balance">
        <span className="shopHudLabel">Balance</span>
        <div className="shopHudValueRow">
          <strong className="shopHudValue">{formatCoins(coins)}</strong>
          <span className="shopHudValueMeta">coins</span>
        </div>
        <p className="shopHudFoot">
          {affordableCount > 0
            ? `${affordableCount} unlocks ready now`
            : "Keep earning for your next unlock"}
        </p>
      </div>

      <div className="shopHudStat shopHudStat-collection">
        <span className="shopHudLabel">Collection</span>
        <div className="shopHudValueRow">
          <strong className="shopHudValue">
            {totalOwnedCount}/{totalItems}
          </strong>
          <span className="shopHudValueMeta">{collectionPercent}% owned</span>
        </div>
        <div className="shopHudMeter" aria-hidden="true">
          <span className="shopHudMeterFill" style={{ width: `${collectionPercent}%` }} />
        </div>
      </div>

      <div className="shopHudMotivation">
        <span className="shopHudLabel">{targetSummary.label}</span>
        <strong className="shopHudMotivationValue">{targetSummary.value}</strong>
        <p className="shopHudMotivationText">{targetSummary.detail}</p>
        <div className="shopHudMotivationFoot">
          <span className="shopHudMotivationChip">
            {affordableCount > 0 ? `${affordableCount} available` : "No instant unlocks"}
          </span>
          <span className="shopHudMotivationChip">{totalItems - totalOwnedCount} remaining</span>
        </div>
      </div>
    </section>
  )
}
