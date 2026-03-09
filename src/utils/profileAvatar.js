export function getProfileInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "P"
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

export function getProfileAvatarStyle(seedText = "") {
  const seed = [...String(seedText)].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const hue = seed % 360
  const nextHue = (hue + 36) % 360

  // Keep the generated identity tile stable for the same username.
  return {
    background: `linear-gradient(145deg, hsl(${hue} 78% 62%), hsl(${nextHue} 74% 52%))`,
  }
}
