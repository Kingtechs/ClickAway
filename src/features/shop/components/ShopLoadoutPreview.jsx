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

  return (
    <section className="shopLoadoutPreview" aria-label="Current cosmetic loadout preview">
      <div className="shopLoadoutPreviewHeader">
        <div>
          <p className="shopLoadoutEyebrow">Live Loadout</p>
          <h2 className="shopLoadoutTitle">Current loadout</h2>
        </div>
        <div className="shopLoadoutMeta">
          <span>{buttonSkin?.name ?? "Button skin"}</span>
          <span>{arenaTheme?.name ?? "Arena theme"}</span>
          <span>{profileImage?.name ?? "Profile image"}</span>
        </div>
      </div>

      <div className={`shopLoadoutArena ${arenaTheme?.effectClass ?? ""}`}>
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

        <div
          className={`shopLoadoutButton ${hasButtonImage ? "hasImage" : buttonSkin?.effectClass ?? ""}`}
          style={getButtonPreviewStyle(buttonSkin)}
          aria-hidden="true"
        >
          Click
        </div>
      </div>
    </section>
  )
}
