import { useGameStore } from "@/web/store/gameStore";
import { BattleView } from "@/web/views/BattleView";
import { CampaignView } from "@/web/views/CampaignView";
import { LabView } from "@/web/views/LabView";
import { MainMenuView } from "@/web/views/MainMenuView";
import { ShopView } from "@/web/views/ShopView";

export function App() {
  const { view } = useGameStore();

  return (
    <div className="min-h-screen bg-zinc-950">
      {view === "menu" && <MainMenuView />}
      {view === "campaign" && <CampaignView />}
      {view === "shop" && <ShopView />}
      {view === "battle" && <BattleView />}
      {view === "lab" && <LabView />}
    </div>
  );
}
