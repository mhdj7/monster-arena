export const dynamic = "force-dynamic";

import { getYou } from "@/lib/game/queries";
import { FusionClient } from "@/components/FusionClient";

export default async function FusionPage() {
  const you = await getYou();
  const inventory: Record<string, number> = {};
  for (const r of you.inventory) inventory[r.key] = r.quantity;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">🔀 آزمایشگاه فیوژن</h1>
      <p className="text-white/60 text-sm">
        هر هیولا ۸ مسیر فیوژن دارد. گزینه‌های ۱ تا ۷ تبدیل مشخص هستند و گزینه ۸ تبدیل کاملاً
        رندوم به یک هیولای جدید است.
      </p>
      {you.monsters.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-white/60">هیولایی نداری.</div>
      ) : (
        <FusionClient monsters={you.monsters} inventory={inventory} />
      )}
    </div>
  );
}
