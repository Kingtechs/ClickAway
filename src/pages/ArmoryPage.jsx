import ArmoryScreen from "../features/armory/components/ArmoryScreen.jsx"
import { useArmoryScreenController } from "../features/armory/hooks/useArmoryScreenController.js"

export default function ArmoryPage(props) {
  const { isReady, ...screen } = useArmoryScreenController(props)

  if (!isReady) return null

  return <ArmoryScreen {...screen} />
}
