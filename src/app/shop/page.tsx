export const dynamic = "force-dynamic";

import { getShop, getYou } from "@/lib/game/queries";
import { ShopClient } from "@/components/ShopClient";

export default async function ShopPage() {
  const [you, offers] = await Promise.all([getYou(), getShop()]);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">🛒 فروشگاه</h1>
        <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 font-bold">
          🪙 {you.gold.toLocaleString("fa-IR")}
        </span>
      </div>
      <ShopClient resources={you.inventory} offers={offers} gold={you.gold} />
    </div>
  );
}
