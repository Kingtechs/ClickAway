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

export const SHOP_CATEGORIES = [
  {
    id: "button_skins",
    title: "Button Skins",
    description: "Cosmetic styles for the main click target.",
    items: [
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
        cost: 14,
        effectClass: "skin-neoncircle",
        imageSrc: "/neoncircle.avif",
        gameImageScale: 115,
        shopImageScale: 100,
        description: "Electric ring core that pops against dark arenas.",
      }),
      createButtonSkinItem({
        id: "skin_fireball",
        name: "Fireball",
        cost: 125,
        imageSrc: "/fireball.png",
        gameImageScale: 160,
        shopImageScale: 130,
        description: "Molten flame orb with high-contrast impact energy.",
      }),
      createButtonSkinItem({
        id: "skin_cd",
        name: "CD",
        cost: 236,
        effectClass: "skin-cd",
        imageSrc: "/cd.png",
        gameImageScale: 100,
        shopImageScale: 90,
        description: "Reflective disc finish with a retro-tech look.",
      }),
      createButtonSkinItem({
        id: "skin_earth",
        name: "Earth",
        cost: 347,
        effectClass: "skin-earth",
        imageSrc: "/earth.png",
        gameImageScale: 110,
        shopImageScale: 100,
        description: "Blue-green planet style with a calm orbital vibe.",
      }),
      createButtonSkinItem({
        id: "skin_melon",
        name: "Melon",
        cost: 458,
        effectClass: "skin-melon",
        imageSrc: "/melon.png",
        gameImageScale: 105,
        shopImageScale: 90,
        description: "Fresh summer palette with playful watermelon contrast.",
      }),
      createButtonSkinItem({
        id: "skin_moon",
        name: "Moon",
        cost: 569,
        effectClass: "skin-moon",
        imageSrc: "/moon.png",
        gameImageScale: 105,
        shopImageScale: 95,
        description: "Soft lunar texture with cool cratered highlights.",
      }),
      createButtonSkinItem({
        id: "skin_wheel",
        name: "Wheel",
        cost: 680,
        effectClass: "skin-wheel",
        imageSrc: "/wheel.png",
        gameImageScale: 115,
        shopImageScale: 105,
        description: "High-speed spoke pattern built for motion energy.",
      }),
      createButtonSkinItem({
        id: "skin_xboxbutton",
        name: "Xbox",
        cost: 791,
        effectClass: "skin-xboxbutton",
        imageSrc: "/xboxbutton.png",
        gameImageScale: 105,
        shopImageScale: 95,
        description: "Controller-inspired button face with bold contrast.",
      }),
      createButtonSkinItem({
        id: "skin_coin",
        name: "Gold Token",
        cost: 902,
        effectClass: "skin-coin",
        imageSrc: "/coin.png",
        gameImageScale: 140,
        shopImageScale: 130,
        description: "Classic arcade token style with metallic shine.",
      }),
    ],
  },
  {
    id: "arena_themes",
    title: "Arena Themes",
    description: "Background/theme swaps for the game arena.",
    items: [
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
        cost: 236,
        effectClass: "theme-sunset",
        description: "Warm dusk sky over a glowing retro horizon grid.",
      }),
      createArenaThemeItem({
        id: "theme_forest",
        name: "Forest Glow",
        cost: 569,
        effectClass: "theme-forest",
        description: "Misty woodland tones with bioluminescent highlights.",
      }),
      createArenaThemeItem({
        id: "theme_arcade",
        name: "Arcade Night",
        cost: 902,
        effectClass: "theme-arcade",
        description: "Synthwave-inspired night lane with neon lane lines.",
      }),
    ],
  },
  {
    id: "profile_images",
    title: "Profile Images",
    description: "Equip portraits for your player profile card.",
    items: [
      createProfileImageItem({
        id: "profile_default",
        name: "Identity Gradient",
        cost: 0,
        builtIn: true,
        effectClass: "profile-image-default",
        description: "Dynamic initials tile keyed to your username.",
      }),
      createProfileImageItem({
        id: "profile_racoon",
        name: "Raccoon Scout",
        cost: 3,
        effectClass: "profile-image-racoon",
        imageSrc: "/racoon.png",
        shopImageScale: 96,
        description:
          "A sharp-eyed midnight scavenger portrait.",
      }),
      createProfileImageItem({
        id: "profile_lock",
        name: "Secure Lock",
        cost: 3,
        effectClass: "profile-image-lock",
        imageSrc: "/lock.png",
        shopImageScale: 94,
        description:
          "A no-compromise defense mindset.",
      }),
      createProfileImageItem({
        id: "profile_heart",
        name: "Heart Pulse",
        cost: 3,
        effectClass: "profile-image-heart",
        imageSrc: "/heart.png",
        shopImageScale: 95,
        description:
          "A bright heart icon with warm glow accents.",
      }),
      createProfileImageItem({
        id: "profile_ghost",
        name: "Phantom Drift",
        cost: 3,
        effectClass: "profile-image-ghost",
        imageSrc: "/ghost.png",
        shopImageScale: 95,
        description:
          "A mischievous ghost portrait, haunting arcade style.",
      }),
      createProfileImageItem({
        id: "profile_grape",
        name: "Grape Burst",
        cost: 3,
        effectClass: "profile-image-grape",
        imageSrc: "/grape.png",
        shopImageScale: 93,
        description:
          "A juicy grape cluster badge with bold color depth.",
      }),
      createProfileImageItem({
        id: "profile_flashlight",
        name: "Night Beam",
        cost: 3,
        effectClass: "profile-image-flashlight",
        imageSrc: "/flashlight.png",
        shopImageScale: 94,
        description:
          "A tactical flashlight portrait casting a focused beam.",
      }),
    ],
  },
]

export const SHOP_ITEMS = SHOP_CATEGORIES.flatMap((category) => category.items)

export const SHOP_ITEMS_BY_ID = Object.fromEntries(
  SHOP_ITEMS.map((item) => [item.id, item])
)
