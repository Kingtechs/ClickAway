function createButtonSkinItem({
  id,
  name,
  cost,
  effectClass,
  imageSrc = "",
  gameImageScale = 100,
  shopImageScale = 100,
  description,
  builtIn = false,
}) {
  return {
    id,
    type: "button_skin",
    name,
    cost,
    effectClass,
    imageSrc,
    gameImageScale,
    shopImageScale,
    description,
    builtIn,
  }
}

function createArenaThemeItem({
  id,
  name,
  cost,
  effectClass,
  description,
  builtIn = false,
}) {
  return {
    id,
    type: "arena_theme",
    name,
    cost,
    effectClass,
    description,
    builtIn,
  }
}

function createProfileImageItem({
  id,
  name,
  cost,
  effectClass,
  imageSrc = "",
  shopImageScale = 100,
  description,
  builtIn = false,
}) {
  return {
    id,
    type: "profile_image",
    name,
    cost,
    effectClass,
    imageSrc,
    shopImageScale,
    description,
    builtIn,
  }
}

function applyIncrementalCosts(items = [], maxCost = 999) {
  if (!Array.isArray(items) || items.length <= 1) return items

  const lastIndex = items.length - 1

  return items.map((item, index) => ({
    ...item,
    cost: Math.round((maxCost * index) / lastIndex),
  }))
}

export const SHOP_CATEGORIES = [
  {
    id: "button_skins",
    title: "Button Skins",
    description: "Cosmetic styles for the main click target.",
    items: applyIncrementalCosts([
      createButtonSkinItem({
        id: "skin_button",
        name: "Classic",
        cost: 0,
        builtIn: true,
        effectClass: "skin-button",
        imageSrc: "/button.png",
        gameImageScale: 120,
        shopImageScale: 105,
        description: "Clean button finish.",
      }),
      createButtonSkinItem({
        id: "skin_neon",
        name: "Neon Pulse",
        cost: 25,
        effectClass: "skin-neoncircle",
        imageSrc: "/neoncircle.avif",
        gameImageScale: 115,
        shopImageScale: 100,
        description: "Electric ring core that pops against dark arenas.",
      }),
      createButtonSkinItem({
        id: "skin_fireball",
        name: "Fireball",
        cost: 30,
 
        imageSrc: "/fireball.png",
        gameImageScale: 160,
        shopImageScale: 130,
        description: "Molten flame orb with high-contrast impact energy.",
      }),
      createButtonSkinItem({
        id: "skin_cd",
        name: "CD",
        cost: 30,
        effectClass: "skin-cd",
        imageSrc: "/cd.png",
        gameImageScale: 100,
        shopImageScale: 90,
        description: "Reflective disc finish with a retro-tech look.",
      }),
      createButtonSkinItem({
        id: "skin_earth",
        name: "Earth",
        cost: 30,
        effectClass: "skin-earth",
        imageSrc: "/earth.png",
        gameImageScale: 110,
        shopImageScale: 100,
        description: "Blue-green planet style with a calm orbital vibe.",
      }),
      createButtonSkinItem({
        id: "skin_melon",
        name: "Melon",
        cost: 30,
        effectClass: "skin-melon",
        imageSrc: "/melon.png",
        gameImageScale: 105,
        shopImageScale: 90,
        description: "Fresh summer palette with playful watermelon contrast.",
      }),
      createButtonSkinItem({
        id: "skin_moon",
        name: "Moon",
        cost: 30,
        effectClass: "skin-moon",
        imageSrc: "/moon.png",
        gameImageScale: 105,
        shopImageScale: 95,
        description: "Soft lunar texture with cool cratered highlights.",
      }),
      createButtonSkinItem({
        id: "skin_wheel",
        name: "Wheel",
        cost: 30,
        effectClass: "skin-wheel",
        imageSrc: "/wheel.png",
        gameImageScale: 115,
        shopImageScale: 105,
        description: "High-speed spoke pattern built for motion energy.",
      }),
      createButtonSkinItem({
        id: "skin_xboxbutton",
        name: "Xbox",
        cost: 30,
        effectClass: "skin-xboxbutton",
        imageSrc: "/xboxbutton.png",
        gameImageScale: 105,
        shopImageScale: 95,
        description: "Controller-inspired button face with bold contrast.",
      }),
      createButtonSkinItem({
        id: "skin_coin",
        name: "Gold Token",
        cost: 999,
        effectClass: "skin-coin",
        imageSrc: "/coin.png",
        gameImageScale: 140,
        shopImageScale: 130,
        description: "Classic arcade token style with metallic shine.",
      }),
    ]),
  },
  {
    id: "arena_themes",
    title: "Arena Themes",
    description: "Background/theme swaps for the game arena.",
    items: applyIncrementalCosts([
      createArenaThemeItem({
        id: "theme_default",
        name: "Classic Arena",
        cost: 0,
        builtIn: true,
        effectClass: "theme-default",
        description: "Balanced training arena with subtle focus lighting.",
      }),
      createArenaThemeItem({
        id: "theme_sunset",
        name: "Sunset Grid",
        cost: 40,
        effectClass: "theme-sunset",
        description: "Warm dusk sky over a glowing retro horizon grid.",
      }),
      createArenaThemeItem({
        id: "theme_forest",
        name: "Forest Glow",
        cost: 45,
        effectClass: "theme-forest",
        description: "Misty woodland tones with bioluminescent highlights.",
      }),
      createArenaThemeItem({
        id: "theme_arcade",
        name: "Arcade Night",
        cost: 999,
        effectClass: "theme-arcade",
        description: "Synthwave-inspired night lane with neon lane lines.",
      }),
    ]),
  },
  {
    id: "profile_images",
    title: "Profile Images",
    description: "Equip portraits for your player profile card.",
    items: applyIncrementalCosts([
      createProfileImageItem({
        id: "profile_default",
        name: "Identity Gradient",
        cost: 0,
        builtIn: true,
        effectClass: "profile-image-default",
        description: "Dynamic initials tile keyed to your username.",
      }),
      createProfileImageItem({
        id: "profile_compass",
        name: "Compass Mark",
        cost: 35,
        effectClass: "profile-image-compass",
        imageSrc: "/pointerimage.png",
        shopImageScale: 78,
        description: "Clean directional marker portrait with a subtle glow.",
      }),
      createProfileImageItem({
        id: "profile_lunar",
        name: "Lunar Core",
        cost: 45,
        effectClass: "profile-image-lunar",
        imageSrc: "/moon.png",
        shopImageScale: 132,
        description: "Moonlit portrait plate with cool crater texture.",
      }),
      createProfileImageItem({
        id: "profile_gold",
        name: "Gold Crest",
        cost: 999,
        effectClass: "profile-image-gold",
        imageSrc: "/coin.png",
        shopImageScale: 128,
        description: "High-tier token emblem for a premium profile finish.",
      }),
    ]),
  },
]

export const SHOP_ITEMS = SHOP_CATEGORIES.flatMap((category) => category.items)

export const SHOP_ITEMS_BY_ID = Object.fromEntries(
  SHOP_ITEMS.map((item) => [item.id, item])
)
