"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CardView } from "@/lib/game/queries";
import { MonsterCard } from "@/components/MonsterCard";
import { trainTemp } from "@/app/actions";
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS_FA,
  AttributeKey,
  TUNING,
} from "@/lib/game/constants";

const ATTR_ICON: Record<AttributeKey, string> = {
  power: "💪",
  defense: "🛡️",
  speed: "💨",
  evasion: "🌀",
  intelligence: "🧠",
  accuracy: "🎯",
};

export function TrainClient({ monsters }: { monsters: CardView[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(monsters[0]?.id ?? null);
  const [attr, setAttr] = useState<AttributeKey>("power");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const selected = monsters.find((m) => m.id === selectedId) ?? null;

  function run() {
    if (!selected) return;
    setMsg(null);
    startTransition(async () => {
      const res = await trainTemp(selected.id, attr);
      setMsg({ ok: res.ok, text: res.ok ? res.message ?? "انجام شد" : res.error ?? "خطا" });
      if (res.ok) router.refresh();
    });
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

      <div className="space-y-4">
        <h2 className="font-bold">۲) تمرین</h2>
        {!selected ? (
          <div className="glass rounded-2xl p-6 text-white/60">یک هیولا انتخاب کن.</div>
        ) : (
          <div className="glass rounded-2xl p-4 space-y-4">
            <MonsterCard card={selected} />

            <div>
              <div className="text-sm text-white/60 mb-2">اتریبیوت هدف:</div>
              <div className="grid grid-cols-3 gap-2">
                {ATTRIBUTE_KEYS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAttr(a)}
                    className={`btn text-sm ${attr === a ? "btn-primary" : "btn-ghost"}`}
                  >
                    {ATTR_ICON[a]} {ATTRIBUTE_LABELS_FA[a]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <div className="font-bold text-sky-200">تمرین موقت</div>
              <div className="text-xs text-white/60 mt-1">
                +{TUNING.tempTrainAmount} موقت • {TUNING.tempTrainEnergyCost} انرژی •{" "}
                تا پایان روز
              </div>
              <button
                onClick={() => run()}
                disabled={pending || selected.energy < TUNING.tempTrainEnergyCost}
                className="btn btn-primary w-full mt-2"
              >
                تمرین موقت
              </button>
            </div>

            {msg && (
              <div
                className={`rounded-xl px-3 py-2 text-sm ${
                  msg.ok ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200"
                }`}
              >
                {msg.text}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
