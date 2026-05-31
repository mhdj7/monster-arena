"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buyMonster, buyResource } from "@/app/actions";

type ResourceItem = {
  key: string;
  name: string;
  nameFa: string;
  icon: string;
  price: number;
  quantity: number;
};

type MonsterOffer = {
  id: string;
  price: number;
  species: {
    nameFa: string;
    icon: string;
    rarity: string;
    rarityFa: string;
    power: number;
    defense: number;
    speed: number;
    evasion: number;
    intelligence: number;
    accuracy: number;
  };
};

export function ShopClient({
  resources,
  offers,
  gold,
}: {
  resources: ResourceItem[];
  offers: MonsterOffer[];
  gold: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function getQty(key: string) {
    return qty[key] ?? 1;
  }

  function buyRes(key: string) {
    setMsg(null);
    startTransition(async () => {
      const res = await buyResource(key, getQty(key));
      setMsg({ ok: res.ok, text: res.ok ? res.message ?? "خرید شد" : res.error ?? "خطا" });
      if (res.ok) router.refresh();
    });
  }

  function buyMon(id: string) {
    setMsg(null);
    startTransition(async () => {
      const res = await buyMonster(id);
      setMsg({ ok: res.ok, text: res.ok ? res.message ?? "خرید شد" : res.error ?? "خطا" });
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div
          className={`rounded-xl px-4 py-2 text-sm ${
            msg.ok ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      <section>
        <h2 className="font-bold mb-3">🐉 کارت‌های هیولا (دوره‌ای)</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {offers.map((o) => (
            <div key={o.id} className={`glass rounded-2xl p-3 ring-rarity-${o.species.rarity}`}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{o.species.icon}</span>
                <div>
                  <div className="font-bold">{o.species.nameFa}</div>
                  <div className={`text-xs rarity-${o.species.rarity}`}>
                    ● {o.species.rarityFa}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs mt-3 text-white/60">
                <span>💪 {o.species.power}</span>
                <span>🛡️ {o.species.defense}</span>
                <span>💨 {o.species.speed}</span>
                <span>🌀 {o.species.evasion}</span>
                <span>🧠 {o.species.intelligence}</span>
                <span>🎯 {o.species.accuracy}</span>
              </div>
              <button
                onClick={() => buyMon(o.id)}
                disabled={pending || gold < o.price}
                className="btn btn-gold w-full mt-3"
              >
                🪙 {o.price.toLocaleString("fa-IR")}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold mb-3">📦 منابع (فروشگاه دائمی)</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {resources.map((r) => (
            <div key={r.key} className="glass rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{r.icon}</span>
                  <div>
                    <div className="font-bold text-sm">{r.nameFa}</div>
                    <div className="text-xs text-white/50">موجودی: {r.quantity}</div>
                  </div>
                </div>
                <span className="text-amber-300 text-sm font-bold">🪙 {r.price}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="number"
                  min={1}
                  value={getQty(r.key)}
                  onChange={(e) =>
                    setQty((q) => ({ ...q, [r.key]: Math.max(1, Number(e.target.value) || 1) }))
                  }
                  className="w-16 bg-white/5 rounded-lg px-2 py-1.5 text-sm text-center outline-none"
                />
                <button
                  onClick={() => buyRes(r.key)}
                  disabled={pending || gold < r.price * getQty(r.key)}
                  className="btn btn-ghost flex-1 text-sm"
                >
                  خرید ({(r.price * getQty(r.key)).toLocaleString("fa-IR")}🪙)
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
