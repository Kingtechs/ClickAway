import { SHOP_CATEGORIES, SHOP_ITEMS_BY_ID } from "../src/constants/shopCatalog.js"

const CATEGORY_CONFIG_BY_TYPE = {
  button_skin: {
    type: "button_skin",
    joinTable: "user_button_skins",
    itemColumn: "skin_id",
    defaultItemId: "skin_button",
    responseKey: "equippedButtonSkinId",
  },
  arena_theme: {
    type: "arena_theme",
    joinTable: "user_arena_themes",
    itemColumn: "theme_id",
    defaultItemId: "theme_default",
    responseKey: "equippedArenaThemeId",
  },
  profile_image: {
    type: "profile_image",
    joinTable: "user_profile_themes",
    itemColumn: "theme_id",
    defaultItemId: "profile_default",
    responseKey: "equippedProfileImageId",
  },
}

const MYSQL_SEEDED_ITEM_DATA = {
  skin_button: { dbItemId: 13, cost: 0 },
  skin_neon: { dbItemId: 14, cost: 14 },
  skin_fireball: { dbItemId: 15, cost: 125 },
  skin_cd: { dbItemId: 16, cost: 236 },
  skin_earth: { dbItemId: 17, cost: 347 },
  skin_melon: { dbItemId: 18, cost: 458 },
  skin_moon: { dbItemId: 19, cost: 569 },
  skin_wheel: { dbItemId: 20, cost: 680 },
  skin_xboxbutton: { dbItemId: 21, cost: 791 },
  skin_coin: { dbItemId: 22, cost: 902 },
  theme_default: { dbItemId: 10, cost: 0 },
  theme_sunset: { dbItemId: 11, cost: 236 },
  theme_forest: { dbItemId: 12, cost: 569 },
  theme_arcade: { dbItemId: 13, cost: 902 },
  profile_default: { dbItemId: 7, cost: 0 },
  profile_racoon: { dbItemId: 8, cost: 3 },
  profile_lock: { dbItemId: 9, cost: 3 },
  profile_heart: { dbItemId: 10, cost: 3 },
  profile_ghost: { dbItemId: 11, cost: 3 },
  profile_grape: { dbItemId: 12, cost: 3 },
  profile_flashlight: { dbItemId: 13, cost: 3 },
}

const SHOP_ITEM_DB_MAP = Object.fromEntries(
  SHOP_CATEGORIES.flatMap((category) =>
    category.items.map((item) => {
      const seededItemData = MYSQL_SEEDED_ITEM_DATA[item.id]

      if (!seededItemData) {
        throw new Error(`Missing MySQL item mapping for frontend item "${item.id}".`)
      }

      return [
        item.id,
        {
          frontendItemId: item.id,
          dbItemId: seededItemData.dbItemId,
          type: item.type,
          builtIn: Boolean(item.builtIn),
          cost: seededItemData.cost,
          ...CATEGORY_CONFIG_BY_TYPE[item.type],
        },
      ]
    })
  )
)

const FRONTEND_ITEM_ID_BY_DB_KEY = Object.fromEntries(
  Object.values(SHOP_ITEM_DB_MAP).map((item) => [
    `${item.type}:${item.dbItemId}`,
    item.frontendItemId,
  ])
)

export const DEFAULT_PLAYER_STATE = {
  coins: 0,
  ownedItemIds: [],
  equippedButtonSkinId: CATEGORY_CONFIG_BY_TYPE.button_skin.defaultItemId,
  equippedArenaThemeId: CATEGORY_CONFIG_BY_TYPE.arena_theme.defaultItemId,
  equippedProfileImageId: CATEGORY_CONFIG_BY_TYPE.profile_image.defaultItemId,
}

export const CATEGORY_CONFIGS = Object.values(CATEGORY_CONFIG_BY_TYPE)

export function getCatalogItemById(itemId) {
  return SHOP_ITEMS_BY_ID[itemId] ?? null
}

export function getCategoryConfigByType(type) {
  return CATEGORY_CONFIG_BY_TYPE[type] ?? null
}

export function getDefaultItemIdForType(type) {
  return CATEGORY_CONFIG_BY_TYPE[type]?.defaultItemId || ""
}

export function getMappedShopItemById(itemId) {
  return SHOP_ITEM_DB_MAP[itemId] ?? null
}

export function getFrontendItemIdByDbItemId(type, dbItemId) {
  return FRONTEND_ITEM_ID_BY_DB_KEY[`${type}:${Number(dbItemId)}`] || ""
}
