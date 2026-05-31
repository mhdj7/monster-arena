export const dynamic = "force-dynamic";

import { getYou } from "@/lib/game/queries";
import { MonsterCard } from "@/components/MonsterCard";
import Link from "next/link";

export default async function CollectionPage() {
  const you = await getYou();
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">🗂️ کلکسیون هیولاها</h1>
        <span className="text-white/60 text-sm">{you.monsters.length} هیولا</span>
      </div>

      {you.monsters.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-white/60">
          هنوز هیولایی نداری. از{" "}
          <Link href="/shop" className="text-violet-300 underline">
            فروشگاه
          </Link>{" "}
          یه کارت بخر!
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {you.monsters.map((m) => (
            <MonsterCard key={m.id} card={m} />
          ))}
        </div>
      )}
    </div>
  );
}
