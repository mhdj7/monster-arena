export const dynamic = "force-dynamic";

import { getYou } from "@/lib/game/queries";
import { TrainClient } from "@/components/TrainClient";

export default async function TrainPage() {
  const you = await getYou();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">🏋️ سالن تمرین</h1>
      <p className="text-white/60 text-sm">
        با مصرف انرژی، اتریبیوت‌های هیولا را به‌صورت موقت تقویت کن. تمرین، XP هم می‌دهد.
      </p>
      {you.monsters.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-white/60">هیولایی نداری.</div>
      ) : (
        <TrainClient monsters={you.monsters} />
      )}
    </div>
  );
}
