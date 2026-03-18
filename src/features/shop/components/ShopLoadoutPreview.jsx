import { getProfileAvatarStyle, getProfileInitials } from "../../../utils/profileAvatar.js"

function getButtonPreviewStyle(item) {
  if (!item?.imageSrc) return undefined

  return {
    backgroundImage: `url(${item.imageSrc})`,
    backgroundSize: `${item.gameImageScale ?? item.shopImageScale ?? 100}%`,
  }
}

function getProfilePreviewStyle(item, playerName) {
  if (item?.imageSrc) return undefined
  return getProfileAvatarStyle(playerName)
}

export default function ShopLoadoutPreview({
  buttonSkin,
  arenaTheme,
  profileImage,
  playerName = "Player",
}) {
  const hasButtonImage = Boolean(buttonSkin?.imageSrc)
  const hasProfileImage = Boolean(profileImage?.imageSrc)
  const profileInitials = getProfileInitials(playerName)
  const loadoutSlots = [
    {
      id: "button_skin",
      label: "Button Skin",
      value: buttonSkin?.name ?? "Button skin",
    },
    {
      id: "arena_theme",
      label: "Arena Theme",
      value: arenaTheme?.name ?? "Arena theme",
    },
    {
      id: "profile_image",
      label: "Profile Image",
      value: profileImage?.name ?? "Profile image",
    },
  ]

  return (
    <section className="shopLoadoutStage" aria-label="Current cosmetic loadout preview">
      <div className="shopLoadoutPanel">
        <div className="shopLoadoutPanelHeader">
          <div>
            <p className="shopLoadoutEyebrow">Live Loadout</p>
            <h2 className="shopLoadoutTitle">{playerName}&apos;s showcase</h2>
            <p className="shopLoadoutSubtitle">
              Your equipped cosmetics update here instantly.
            </p>
          </div>
          <span className="shopLoadoutLiveTag">Live</span>
        </div>

        <div className="shopLoadoutSlots" aria-label="Currently equipped cosmetics">
          {loadoutSlots.map((slot) => (
            <div key={slot.id} className="shopLoadoutSlot">
              <span className="shopLoadoutSlotLabel">{slot.label}</span>
              <strong className="shopLoadoutSlotValue">{slot.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className={`shopLoadoutArena ${arenaTheme?.effectClass ?? ""}`}>
        <div className="shopLoadoutArenaFrame">
          <span className="shopLoadoutArenaStatus">Equipped</span>
          <div className="shopLoadoutPedestal" aria-hidden="true" />

          <div className="shopLoadoutAvatarFrame">
            <div
              className={`shopLoadoutAvatar ${profileImage?.effectClass ?? ""} ${hasProfileImage ? "hasImage" : ""}`}
              style={getProfilePreviewStyle(profileImage, playerName)}
              aria-hidden="true"
            >
              {hasProfileImage ? (
                <img className="shopLoadoutAvatarImage" src={profileImage.imageSrc} alt="" />
              ) : (
                profileInitials
              )}
            </div>
            <span className="shopLoadoutAvatarLabel">Profile</span>
          </div>

          <div
            className={`shopLoadoutButton ${hasButtonImage ? "hasImage" : buttonSkin?.effectClass ?? ""}`}
            style={getButtonPreviewStyle(buttonSkin)}
            aria-hidden="true"
          >
            Click
          </div>

          <div className="shopLoadoutPlayerBadge">
            <span className="shopLoadoutPlayerLabel">Operator</span>
            <strong>{playerName}</strong>
          </div>

          <div className="shopLoadoutArenaPlate">
            <span className="shopLoadoutArenaPlateLabel">Arena</span>
            <strong>{arenaTheme?.name ?? "Arena theme"}</strong>
          </div>
        </div>
      </div>
    </section>
  )
}
