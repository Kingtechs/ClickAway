import { useEffect, useMemo, useState } from "react"
import { SHOP_CATEGORIES, SHOP_ITEMS_BY_ID } from "../constants/shopCatalog.js"
import ShopCategoryTabs from "../features/shop/components/ShopCategoryTabs.jsx"
import ShopItemCard from "../features/shop/components/ShopItemCard.jsx"
import ShopLoadoutPreview from "../features/shop/components/ShopLoadoutPreview.jsx"
import ShopStatusHud from "../features/shop/components/ShopStatusHud.jsx"

const ALL_TAB_ID = "all_items"
const SHOP_ITEMS = SHOP_CATEGORIES.flatMap((category) => category.items)

function getOwnedCount(items, ownedItemIds) {
  return items.filter((item) => item.builtIn || ownedItemIds.includes(item.id)).length
}

function getNextUnlockTarget({ coins, ownedItems }) {
  const unlockableItems = SHOP_ITEMS.filter(
    (item) => !item.builtIn && !ownedItems.includes(item.id)
  )

  if (unlockableItems.length === 0) return null

  const affordableItems = unlockableItems
    .filter((item) => coins >= item.cost)
    .sort((left, right) => left.cost - right.cost)

  if (affordableItems.length > 0) {
    return {
      item: affordableItems[0],
      isAffordable: true,
      missingCoins: 0,
    }
  }

  const nextTarget = [...unlockableItems].sort((left, right) => left.cost - right.cost)[0]

  return {
    item: nextTarget,
    isAffordable: false,
    missingCoins: Math.max(0, nextTarget.cost - coins),
  }
}

export default function ShopPage({
  playerName = "Player",
  coins = 0,
  ownedItems = [],
  onPurchase,
  onEquip,
  equippedButtonSkinId = "skin_button",
  equippedArenaThemeId = "theme_default",
  equippedProfileImageId = "profile_default",
}) {
  const [activeCategoryId, setActiveCategoryId] = useState(ALL_TAB_ID)
  const [actionFeedback, setActionFeedback] = useState(null)

  const totalItems = SHOP_ITEMS.length
  const categoryOwnedCounts = useMemo(
    () =>
      Object.fromEntries(
        SHOP_CATEGORIES.map((category) => [category.id, getOwnedCount(category.items, ownedItems)])
      ),
    [ownedItems]
  )
  const totalOwnedCount = Object.values(categoryOwnedCounts).reduce(
    (ownedCount, count) => ownedCount + count,
    0
  )
  const collectionPercent = totalItems > 0 ? Math.round((totalOwnedCount / totalItems) * 100) : 0
  const affordableCount = useMemo(
    () =>
      SHOP_ITEMS.filter(
        (item) => !item.builtIn && !ownedItems.includes(item.id) && coins >= item.cost
      ).length,
    [coins, ownedItems]
  )
  const nextUnlockTarget = useMemo(
    () => getNextUnlockTarget({ coins, ownedItems }),
    [coins, ownedItems]
  )
  const tabs = useMemo(
    () => [
      {
        id: ALL_TAB_ID,
        label: "All Items",
        itemCount: totalItems,
        ownedCount: totalOwnedCount,
      },
      ...SHOP_CATEGORIES.map((category) => ({
        id: category.id,
        label: category.title,
        itemCount: category.items.length,
        ownedCount: categoryOwnedCounts[category.id] ?? 0,
      })),
    ],
    [categoryOwnedCounts, totalItems, totalOwnedCount]
  )
  const visibleCategories = useMemo(
    () =>
      activeCategoryId === ALL_TAB_ID
        ? SHOP_CATEGORIES
        : SHOP_CATEGORIES.filter((category) => category.id === activeCategoryId),
    [activeCategoryId]
  )
  const equippedButtonSkin = SHOP_ITEMS_BY_ID[equippedButtonSkinId] ?? null
  const equippedArenaTheme = SHOP_ITEMS_BY_ID[equippedArenaThemeId] ?? null
  const equippedProfileImage = SHOP_ITEMS_BY_ID[equippedProfileImageId] ?? null

  useEffect(() => {
    if (!actionFeedback) return undefined

    const timeoutId = setTimeout(() => {
      setActionFeedback(null)
    }, 2800)

    return () => clearTimeout(timeoutId)
  }, [actionFeedback])

  function showFeedback(type, message) {
    setActionFeedback({
      id: Date.now(),
      type,
      message,
    })
  }

  function handlePurchase(item) {
    const wasPurchased = onPurchase?.(item) === true
    if (wasPurchased) {
      showFeedback("success", `${item.name} unlocked.`)
      return true
    }

    showFeedback("error", `Could not unlock ${item.name}.`)
    return false
  }

  function handleEquip(item) {
    const wasEquipped = onEquip?.(item) === true
    if (wasEquipped) {
      showFeedback("success", `${item.name} equipped.`)
      return true
    }

    showFeedback("error", `Could not equip ${item.name}.`)
    return false
  }

  return (
    <div className="pageCenter">
      <section className="card shopCard">
        <header className="shopScreenHeader">
          <div>
            <p className="shopScreenEyebrow">Cosmetic Armory</p>
            <h1 className="cardTitle shopScreenTitle">Shop</h1>
            <p className="muted shopScreenSubtitle">
              Build a live loadout with cosmetics earned in the arena.
            </p>
          </div>
          <div className="shopScreenSignal" aria-label="Live inventory status">
            <span className="shopScreenSignalDot" aria-hidden="true" />
            Live Inventory
          </div>
        </header>

        <ShopStatusHud
          coins={coins}
          totalOwnedCount={totalOwnedCount}
          totalItems={totalItems}
          collectionPercent={collectionPercent}
          affordableCount={affordableCount}
          nextUnlockTarget={nextUnlockTarget}
        />

        <ShopLoadoutPreview
          buttonSkin={equippedButtonSkin}
          arenaTheme={equippedArenaTheme}
          profileImage={equippedProfileImage}
          playerName={playerName}
        />

        <ShopCategoryTabs
          tabs={tabs}
          activeCategoryId={activeCategoryId}
          onChange={setActiveCategoryId}
        />

        {actionFeedback ? (
          <div
            key={actionFeedback.id}
            className={`shopFeedback ${actionFeedback.type}`}
            role="status"
            aria-live="polite"
          >
            <span className="shopFeedbackDot" aria-hidden="true" />
            <span>{actionFeedback.message}</span>
            <button
              type="button"
              className="shopFeedbackDismiss"
              aria-label="Dismiss shop feedback"
              onClick={() => setActionFeedback(null)}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="shopInventoryDeck">
          {visibleCategories.map((category) => (
            <section key={category.id} className="shopSection">
              <div className="shopSectionHeader">
                <div className="shopSectionTitleRow">
                  <h2>{category.title}</h2>
                  <span className="shopSectionMeta">
                    {categoryOwnedCounts[category.id] ?? 0}/{category.items.length} owned
                  </span>
                </div>
                <p>{category.description}</p>
              </div>

              <div className="shopGrid">
                {category.items.map((item) => (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    coins={coins}
                    ownedItemIds={ownedItems}
                    onPurchase={handlePurchase}
                    onEquip={handleEquip}
                    equippedButtonSkinId={equippedButtonSkinId}
                    equippedArenaThemeId={equippedArenaThemeId}
                    equippedProfileImageId={equippedProfileImageId}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}
