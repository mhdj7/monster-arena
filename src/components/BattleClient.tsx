"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CardView } from "@/lib/game/queries";
import { MonsterCard } from "@/components/MonsterCard";
import { BattleReplay } from "@/components/BattleReplay";
import { fightOfficial, fightUnderground, FightResponse } from "@/app/actions";

export function BattleClient({
  monsters,
  officialDone,
}: {
  monsters: CardView[];
  officialDone: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"official" | "underground">("official");
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [replay, setReplay] = useState<FightResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 3
          ? prev
          : [...prev, id]
    );
  }

  function startOfficial() {
    setError(null);
    startTransition(async () => {
      const res = await fightOfficial(selected);
      if (!res.ok) {
        setError(res.error ?? "خطا");
        return;
      }
      setReplay(res);
    });
  }

  function startUnderground(cardId: string) {
    setError(null);
    startTransition(async () => {
      const res = await fightUnderground(cardId);
      if (!res.ok) {
        setError(res.error ?? "خطا");
        return;
      }
      setReplay(res);
    });
  }

  function closeReplay() {
    setReplay(null);
    setSelected([]);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("official")}
          className={`btn ${tab === "official" ? "btn-primary" : "btn-ghost"}`}
        >
          ⚔️ مبارزه رسمی (۳v۳)
        </button>
        <button
          onClick={() => setTab("underground")}
          className={`btn ${tab === "underground" ? "btn-primary" : "btn-ghost"}`}
        >
          🏚 رینگ زیرزمینی (۱v۱)
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/15 text-rose-200 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {tab === "official" ? (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-bold">تیم مبارزه رسمی روزانه</div>
              <div className="text-sm text-white/60">
                ۳ هیولا انتخاب کن — انتخاب‌شده: {selected.length}/۳
              </div>
            </div>
            {officialDone ? (
              <span className="text-emerald-300 text-sm">✅ مبارزه رسمی امروز انجام شده</span>
            ) : (
              <button
                onClick={startOfficial}
                disabled={pending || selected.length !== 3}
                className="btn btn-primary"
              >
                {pending ? "در حال مبارزه..." : "شروع مبارزه"}
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {monsters.map((m) => (
              <MonsterCard
                key={m.id}
                card={m}
                selected={selected.includes(m.id)}
                onClick={officialDone ? undefined : () => toggle(m.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-4">
            <div className="font-bold">رینگ زیرزمینی</div>
            <div className="text-sm text-white/60">
              یک هیولا بفرست — ۱ انرژی مصرف می‌کنه و هیولا خسته می‌شه. محدودیت روزانه نداره.
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {monsters.map((m) => (
              <MonsterCard
                key={m.id}
                card={m}
                footer={
                  <button
                    onClick={() => startUnderground(m.id)}
                    disabled={pending || m.energy < 1}
                    className="btn btn-danger w-full"
                  >
                    {m.energy < 1 ? "انرژی ندارد" : "مبارزه زیرزمینی ⚡"}
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {replay && <BattleReplay data={replay} onClose={closeReplay} />}
    </div>
  );
}
