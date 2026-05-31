"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminSpecies, AdminResource } from "@/lib/game/queries";
import {
  adminUpdateFusions,
  FusionOptionInput,
} from "@/app/admin/actions";

function initialOptions(species: AdminSpecies): FusionOptionInput[] {
  const byIndex = new Map(species.fusions.map((f) => [f.optionIndex, f]));
  const out: FusionOptionInput[] = [];
  for (let i = 1; i <= 8; i++) {
    const f = byIndex.get(i);
    out.push({
      optionIndex: i,
      resultSpeciesId: f?.resultSpeciesId ?? null,
      isRandom: f?.isRandom ?? i === 8,
      costs: f?.costs.map((c) => ({ ...c })) ?? [],
    });
  }
  return out;
}

export function AdminFusionEditor({
  species,
  allSpecies,
  resources,
}: {
  species: AdminSpecies;
  allSpecies: AdminSpecies[];
  resources: AdminResource[];
}) {
  const router = useRouter();
  const [options, setOptions] = useState<FusionOptionInput[]>(() =>
    initialOptions(species)
  );
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function update(idx: number, patch: Partial<FusionOptionInput>) {
    setOptions((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, ...patch } : o))
    );
  }

  function setCost(
    idx: number,
    ci: number,
    patch: Partial<{ resourceKey: string; quantity: number }>
  ) {
    setOptions((prev) =>
      prev.map((o, i) =>
        i === idx
          ? { ...o, costs: o.costs.map((c, j) => (j === ci ? { ...c, ...patch } : c)) }
          : o
      )
    );
  }

  function addCost(idx: number) {
    setOptions((prev) =>
      prev.map((o, i) =>
        i === idx
          ? {
              ...o,
              costs: [
                ...o.costs,
                { resourceKey: resources[0]?.key ?? "", quantity: 1 },
              ],
            }
          : o
      )
    );
  }

  function removeCost(idx: number, ci: number) {
    setOptions((prev) =>
      prev.map((o, i) =>
        i === idx ? { ...o, costs: o.costs.filter((_, j) => j !== ci) } : o
      )
    );
  }

  function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await adminUpdateFusions(species.id, options);
      setMsg({ ok: res.ok, text: res.ok ? res.message ?? "ذخیره شد" : res.error ?? "خطا" });
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-bold text-sm">مسیرهای فیوژن (۸ گزینه)</div>
        <button onClick={save} disabled={pending} className="btn btn-gold text-sm">
          {pending ? "..." : "💾 ذخیره فیوژن‌ها"}
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

      <div className="space-y-2">
        {options.map((o, idx) => (
          <div key={o.optionIndex} className="rounded-xl bg-white/5 p-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-white/40 w-6">#{o.optionIndex}</span>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={o.isRandom}
                  onChange={(e) => update(idx, { isRandom: e.target.checked })}
                />
                🎲 تبدیل رندوم
              </label>
              {!o.isRandom && (
                <select
                  value={o.resultSpeciesId ?? ""}
                  onChange={(e) =>
                    update(idx, { resultSpeciesId: e.target.value || null })
                  }
                  className="flex-1 min-w-[160px] rounded-lg bg-white/5 px-2 py-1 text-sm outline-none focus:ring-2 ring-violet-400"
                >
                  <option value="">— نتیجه را انتخاب کن (پیش‌فرض: رندوم) —</option>
                  {allSpecies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameFa}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] text-white/40">منابع لازم:</div>
              {o.costs.length === 0 && (
                <div className="text-[11px] text-white/30">بدون هزینه (رایگان)</div>
              )}
              {o.costs.map((c, ci) => (
                <div key={ci} className="flex items-center gap-2">
                  <select
                    value={c.resourceKey}
                    onChange={(e) => setCost(idx, ci, { resourceKey: e.target.value })}
                    className="flex-1 rounded-lg bg-white/5 px-2 py-1 text-sm outline-none focus:ring-2 ring-violet-400"
                  >
                    {resources.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.icon} {r.nameFa}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={c.quantity}
                    onChange={(e) =>
                      setCost(idx, ci, {
                        quantity: Math.max(1, Math.round(Number(e.target.value) || 1)),
                      })
                    }
                    className="w-16 rounded-lg bg-white/5 px-2 py-1 text-center text-sm outline-none focus:ring-2 ring-violet-400"
                  />
                  <button
                    onClick={() => removeCost(idx, ci)}
                    className="btn btn-ghost text-xs px-2 py-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => addCost(idx)}
                className="btn btn-ghost text-xs px-2 py-1"
              >
                + افزودن منبع
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
