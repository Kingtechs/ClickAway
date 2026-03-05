import { useEffect, useMemo, useState } from "react"
import { SHOP_CATEGORIES } from "../constants/shopCatalog.js"
import ShopItemCard from "../features/shop/components/ShopItemCard.jsx"

const ALL_TAB_ID = "all_items"

export default function ShopPage({
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

  const totalItems = SHOP_CATEGORIES.reduce(
    (itemCount, category) => itemCount + category.items.length,
    0
  )
  const totalOwnedCount = SHOP_CATEGORIES.reduce(
    (ownedCount, category) =>
      ownedCount +
      category.items.filter((item) => item.builtIn || ownedItems.includes(item.id)).length,
    0
  )
  const tabs = useMemo(
    () => [
      {
        id: ALL_TAB_ID,
        label: "All Items",
        itemCount: totalItems,
      },
      ...SHOP_CATEGORIES.map((category) => ({
        id: category.id,
        label: category.title,
        itemCount: category.items.length,
      })),
    ],
    [totalItems]
  )
  const visibleCategories =
    activeCategoryId === ALL_TAB_ID
      ? SHOP_CATEGORIES
      : SHOP_CATEGORIES.filter((category) => category.id === activeCategoryId)

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
        <h1 className="cardTitle">Shop</h1>
        <p className="muted">
          Spend coins earned from successful clicks.
        </p>
        <div className="shopHero" aria-label="Shop summary">
          <div className="shopHeroStat">
            <span className="shopHeroLabel">Balance</span>
            <strong className="shopHeroValue">{coins.toLocaleString()} coins</strong>
          </div>
          <div className="shopHeroStat">
            <span className="shopHeroLabel">Collection</span>
            <strong className="shopHeroValue">
              {totalOwnedCount}/{totalItems} owned
            </strong>
          </div>
        </div>
        <div className="shopTabs" role="tablist" aria-label="Shop categories">
          {tabs.map((tab) => {
            const isActive = tab.id === activeCategoryId

            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                className={`shopTab ${isActive ? "active" : ""}`}
                aria-selected={isActive}
                onClick={() => setActiveCategoryId(tab.id)}
              >
                <span className="shopTabLabel">{tab.label}</span>
                <span className="shopTabCount">{tab.itemCount}</span>
              </button>
            )
          })}
        </div>

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

        {visibleCategories.map((category) => (
          <section key={category.id} className="shopSection">
            <div className="shopSectionHeader">
              <div className="shopSectionTitleRow">
                <h2>{category.title}</h2>
                <span className="shopSectionMeta">
                  {
                    category.items.filter(
                      (item) => item.builtIn || ownedItems.includes(item.id)
                    ).length
                  }
                  /{category.items.length} owned
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
      </section>
    </div>
  )
}
