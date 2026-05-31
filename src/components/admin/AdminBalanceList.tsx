"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminSpecies } from "@/lib/game/queries";
import { adminUpdateSpeciesBulk, SpeciesEditInput } from "@/app/admin/actions";
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS_FA,
  AttributeKey,
} from "@/lib/game/constants";
import { CardThumb } from "@/components/MonsterCard";

type Row = Record<AttributeKey, number>;

function rowFrom(s: AdminSpecies): Row {
  return {
    power: s.power,
    defense: s.defense,
    speed: s.speed,
    evasion: s.evasion,
    intelligence: s.intelligence,
    accuracy: s.accuracy,
  };
}

export function AdminBalanceList({ species }: { species: AdminSpecies[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [query, setQuery] = useState("");

  // editable values keyed by species id
  const [values, setValues] = useState<Record<string, Row>>(() => {
    const init: Record<string, Row> = {};
    for (const s of species) init[s.id] = rowFrom(s);
    return init;
  });

  const original = useMemo(() => {
    const o: Record<string, Row> = {};
    for (const s of species) o[s.id] = rowFrom(s);
    return o;
  }, [species]);

  const filtered = species.filter(
    (s) =>
      s.nameFa.includes(query) ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.key.includes(query)
  );

  function setVal(id: string, attr: AttributeKey, v: string) {
    const n = v === "" ? 0 : Math.max(1, Math.min(999, Math.round(Number(v) || 0)));
    setValues((prev) => ({ ...prev, [id]: { ...prev[id], [attr]: n } }));
  }

  function isChanged(id: string): boolean {
    const a = values[id];
    const b = original[id];
    if (!a || !b) return false;
    return ATTRIBUTE_KEYS.some((k) => a[k] !== b[k]);
  }

  const changedIds = species.filter((s) => isChanged(s.id)).map((s) => s.id);

  function saveAll() {
    if (changedIds.length === 0) return;
    setMsg(null);
    const updates = changedIds.map((id) => ({
      id,
      input: { ...values[id] } as SpeciesEditInput,
    }));
    startTransition(async () => {
      const res = await adminUpdateSpeciesBulk(updates);
      setMsg({ ok: res.ok, text: res.ok ? res.message ?? "ذخیره شد" : res.error ?? "خطا" });
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی هیولا..."
          className="rounded-xl bg-white/5 px-3 py-2 outline-none focus:ring-2 ring-violet-400 text-sm"
        />
        <div className="flex items-center gap-3">
          {changedIds.length > 0 && (
            <span className="text-xs text-amber-300">{changedIds.length} تغییر ذخیره‌نشده</span>
          )}
          <button
            onClick={saveAll}
            disabled={pending || changedIds.length === 0}
            className="btn btn-gold text-sm"
          >
            {pending ? "در حال ذخیره..." : "💾 ذخیره همه"}
          </button>
        </div>
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

      <div className="glass rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-white/50 text-xs border-b border-white/10">
              <th className="text-right p-2 sticky right-0 bg-black/20">هیولا</th>
              {ATTRIBUTE_KEYS.map((a) => (
                <th key={a} className="p-2 text-center whitespace-nowrap">
                  {ATTRIBUTE_LABELS_FA[a]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const changed = isChanged(s.id);
              return (
                <tr
                  key={s.id}
                  className={`border-b border-white/5 ${changed ? "bg-amber-500/5" : ""}`}
                >
                  <td className="p-2 sticky right-0 bg-black/20">
                    <div className="flex items-center gap-2 min-w-[150px]">
                      <CardThumb
                        imageUrl={s.imageUrl}
                        icon={s.icon}
                        alt={s.nameFa}
                        size="w-8 h-8"
                      />
                      <div className="min-w-0">
                        <div className="font-bold truncate">{s.nameFa}</div>
                        <div className="text-[10px] text-white/40 truncate">
                          {s.isBase ? "پایه" : "تکامل‌یافته"}
                        </div>
                      </div>
                    </div>
                  </td>
                  {ATTRIBUTE_KEYS.map((a) => (
                    <td key={a} className="p-1.5 text-center">
                      <input
                        type="number"
                        value={values[s.id]?.[a] ?? 0}
                        onChange={(e) => setVal(s.id, a, e.target.value)}
                        className="w-14 rounded-lg bg-white/5 px-2 py-1 text-center outline-none focus:ring-2 ring-violet-400"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-white/40">
        اعداد اتریبیوت‌های هر کارت را تغییر بده و «ذخیره همه» را بزن. این مقادیر پایه‌ی
        هر گونه هستند و مستقیماً روی قدرت کارت‌ها در بازی اثر می‌گذارند.
      </p>
    </div>
  );
}
