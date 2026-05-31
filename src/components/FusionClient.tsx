"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CardView } from "@/lib/game/queries";
import { MonsterCard } from "@/components/MonsterCard";
import { doFusion, loadFusionForCard } from "@/app/actions";

type FusionData = Awaited<ReturnType<typeof loadFusionForCard>>;

export function FusionClient({
  monsters,
  inventory,
}: {
  monsters: CardView[];
  inventory: Record<string, number>;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(monsters[0]?.id ?? null);
  const [data, setData] = useState<FusionData>(null);
  const [loading, startLoad] = useTransition();
  const [pending, startFuse] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    startLoad(async () => {
      const d = await loadFusionForCard(selectedId);
      if (active) setData(d);
    });
    return () => {
      active = false;
    };
  }, [selectedId]);

  function fuse(optionIndex: number) {
    if (!selectedId) return;
    setResult(null);
    startFuse(async () => {
      const res = await doFusion(selectedId, optionIndex);
      if (res.ok) {
        setResult({
          ok: true,
          text: `${res.newIcon ?? ""} هیولا به «${res.newSpeciesFa}» تبدیل شد!`,
        });
        router.refresh();
        const d = await loadFusionForCard(selectedId);
        setData(d);
      } else {
        setResult({ ok: false, text: res.error ?? "خطا" });
      }
    });
  }

  function canAfford(costs: { key: string; quantity: number }[]) {
    return costs.every((c) => (inventory[c.key] ?? 0) >= c.quantity);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="space-y-3">
        <h2 className="font-bold">۱) هیولا را انتخاب کن</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {monsters.map((m) => (
            <MonsterCard
              key={m.id}
              card={m}
              compact
              selected={m.id === selectedId}
              onClick={() => setSelectedId(m.id)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-bold">۲) مسیر فیوژن (۸ گزینه)</h2>
        {result && (
          <div
            className={`rounded-xl px-3 py-2 text-sm ${
              result.ok ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200"
            }`}
          >
            {result.text}
          </div>
        )}
        {loading || !data ? (
          <div className="glass rounded-2xl p-6 text-white/60">در حال بارگذاری...</div>
        ) : (
          <div className="space-y-2">
            {data.recipes.map((r) => {
              const affordable = canAfford(r.costs);
              return (
                <div
                  key={r.id}
                  className={`glass rounded-xl p-3 ${
                    r.isRandom ? "ring-rarity-legendary" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-white/40 w-6">#{r.optionIndex}</span>
                      {r.isRandom ? (
                        <span className="font-bold text-amber-300">🎲 تبدیل کاملاً رندوم</span>
                      ) : (
                        <span className="font-bold truncate">
                          {r.result?.icon} {r.result?.nameFa}{" "}
                          <span className={`text-xs rarity-${r.result?.rarity}`}>
                            ({r.result?.rarityFa})
                          </span>
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => fuse(r.optionIndex)}
                      disabled={pending || !affordable}
                      className="btn btn-primary text-sm"
                    >
                      فیوژن
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {r.costs.map((c) => {
                      const have = inventory[c.key] ?? 0;
                      const ok = have >= c.quantity;
                      return (
                        <span
                          key={c.key}
                          className={`text-xs rounded-lg px-2 py-1 ${
                            ok ? "bg-white/5" : "bg-rose-500/15 text-rose-200"
                          }`}
                        >
                          {c.icon} {c.nameFa} {have}/{c.quantity}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
