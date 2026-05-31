export const dynamic = "force-dynamic";

import { getGameState, getYou } from "@/lib/game/queries";
import { BattleClient } from "@/components/BattleClient";
import Link from "next/link";

export default async function BattlePage() {
  const [you, state] = await Promise.all([getYou(), getGameState()]);
  const officialDone = you.lastOfficialDay >= state.day;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">⚔️ آرنای مبارزه</h1>
      {you.monsters.length < 3 ? (
        <div className="glass rounded-2xl p-8 text-center text-white/60">
          برای مبارزه رسمی حداقل ۳ هیولا لازم داری. از{" "}
          <Link href="/shop" className="text-violet-300 underline">
            فروشگاه
          </Link>{" "}
          کارت بخر.
        </div>
      ) : (
        <BattleClient monsters={you.monsters} officialDone={officialDone} />
      )}
    </div>
  );
}
