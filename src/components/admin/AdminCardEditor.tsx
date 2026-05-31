"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminSpecies, AdminResource } from "@/lib/game/queries";
import {
  adminCreateSpecies,
  adminDeleteSpecies,
  adminUpdateSpecies,
  adminUploadImage,
  SpeciesEditInput,
} from "@/app/admin/actions";
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS_FA,
  AttributeKey,
} from "@/lib/game/constants";
import { CardThumb } from "@/components/MonsterCard";
import { AdminFusionEditor } from "@/components/admin/AdminFusionEditor";

const NEW = "__new__";
const THEMES = [
  { value: "old", label: "قدیمی" },
  { value: "tech", label: "تکنولوژیک" },
];
const RARITIES = [
  { value: "common", label: "معمولی" },
  { value: "rare", label: "کمیاب" },
  { value: "epic", label: "حماسی" },
  { value: "legendary", label: "افسانه‌ای" },
];

type FormState = {
  nameFa: string;
  name: string;
  icon: string;
  theme: string;
  rarity: string;
} & Record<AttributeKey, number>;

function formFrom(s: AdminSpecies | null): FormState {
  return {
    nameFa: s?.nameFa ?? "",
    name: s?.name ?? "",
    icon: s?.icon ?? "🐲",
    theme: s?.theme ?? "tech",
    rarity: s?.rarity ?? "common",
    power: s?.power ?? 10,
    defense: s?.defense ?? 10,
    speed: s?.speed ?? 10,
    evasion: s?.evasion ?? 10,
    intelligence: s?.intelligence ?? 10,
    accuracy: s?.accuracy ?? 10,
  };
}

export function AdminCardEditor({
  species,
  resources,
}: {
  species: AdminSpecies[];
  resources: AdminResource[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(species[0]?.id ?? NEW);
  const isNew = selectedId === NEW;
  const selected = species.find((s) => s.id === selectedId) ?? null;

  const [form, setForm] = useState<FormState>(formFrom(selected));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");

  // Reset the form when the selected species changes (render-time state adjustment).
  const [prevId, setPrevId] = useState(selectedId);
  if (prevId !== selectedId) {
    setPrevId(selectedId);
    setForm(formFrom(isNew ? null : selected));
    setMsg(null);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function save() {
    setMsg(null);
    const input: SpeciesEditInput = { ...form };
    startTransition(async () => {
      if (isNew) {
        const res = await adminCreateSpecies(input);
        setMsg({ ok: res.ok, text: res.ok ? res.message ?? "ساخته شد" : res.error ?? "خطا" });
        if (res.ok && res.id) {
          setSelectedId(res.id);
          router.refresh();
        }
      } else if (selected) {
        const res = await adminUpdateSpecies(selected.id, input);
        setMsg({ ok: res.ok, text: res.ok ? res.message ?? "ذخیره شد" : res.error ?? "خطا" });
        if (res.ok) router.refresh();
      }
    });
  }

  function remove() {
    if (!selected) return;
    if (!confirm(`«${selected.nameFa}» حذف شود؟`)) return;
    startTransition(async () => {
      const res = await adminDeleteSpecies(selected.id);
      setMsg({ ok: res.ok, text: res.ok ? res.message ?? "حذف شد" : res.error ?? "خطا" });
      if (res.ok) {
        setSelectedId(species.find((s) => s.id !== selected.id)?.id ?? NEW);
        router.refresh();
      }
    });
  }

  const filtered = species.filter(
    (s) => s.nameFa.includes(query) || s.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-4">
      {/* species list */}
      <div className="space-y-2">
        <button
          onClick={() => setSelectedId(NEW)}
          className={`btn w-full ${isNew ? "btn-primary" : "btn-ghost"}`}
        >
          ➕ کارت جدید
        </button>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجو..."
          className="w-full rounded-xl bg-white/5 px-3 py-2 outline-none focus:ring-2 ring-violet-400 text-sm"
        />
        <div className="glass rounded-2xl p-2 max-h-[60vh] overflow-y-auto space-y-1">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`w-full flex items-center gap-2 rounded-xl px-2 py-1.5 text-right transition-colors ${
                s.id === selectedId ? "bg-violet-500/20" : "hover:bg-white/5"
              }`}
            >
              <CardThumb imageUrl={s.imageUrl} icon={s.icon} alt={s.nameFa} size="w-8 h-8" />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold truncate">{s.nameFa}</span>
                <span className="block text-[10px] text-white/40 truncate">
                  {s.isBase ? "پایه" : "تکامل‌یافته"} • {s.cardCount} کارت
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* editor */}
      <div className="space-y-4">
        {msg && (
          <div
            className={`rounded-xl px-3 py-2 text-sm ${
              msg.ok ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200"
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="glass rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <CardThumb
              imageUrl={isNew ? null : selected?.imageUrl}
              icon={form.icon || "🐲"}
              alt={form.nameFa}
              size="w-16 h-16"
            />
            <div className="font-bold">
              {isNew ? "ساخت کارت جدید" : `ویرایش: ${selected?.nameFa}`}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="نام فارسی">
              <input
                value={form.nameFa}
                onChange={(e) => set("nameFa", e.target.value)}
                className="inp"
              />
            </Field>
            <Field label="نام انگلیسی">
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="inp"
              />
            </Field>
            <Field label="آیکن (ایموجی)">
              <input
                value={form.icon}
                onChange={(e) => set("icon", e.target.value)}
                className="inp"
                maxLength={4}
              />
            </Field>
            <Field label="تم">
              <select
                value={form.theme}
                onChange={(e) => set("theme", e.target.value)}
                className="inp"
              >
                {THEMES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="ریریتی (کمیابی)">
              <select
                value={form.rarity}
                onChange={(e) => set("rarity", e.target.value)}
                className="inp"
              >
                {RARITIES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div>
            <div className="text-sm text-white/60 mb-2">اتریبیوت‌ها</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ATTRIBUTE_KEYS.map((a) => (
                <Field key={a} label={ATTRIBUTE_LABELS_FA[a]}>
                  <input
                    type="number"
                    value={form[a]}
                    onChange={(e) =>
                      set(a, Math.max(1, Math.round(Number(e.target.value) || 0)))
                    }
                    className="inp"
                  />
                </Field>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={save} disabled={pending} className="btn btn-primary">
              {pending ? "..." : isNew ? "ساخت کارت" : "💾 ذخیره تغییرات"}
            </button>
            {!isNew && selected && (
              <button onClick={remove} disabled={pending} className="btn btn-danger">
                🗑 حذف
              </button>
            )}
          </div>
        </div>

        {/* image */}
        {isNew ? (
          <div className="glass rounded-2xl p-4 text-sm text-white/50">
            برای آپلود عکس، اول کارت را بساز و ذخیره کن.
          </div>
        ) : (
          selected && <ImageEditor key={selected.id} species={selected} />
        )}

        {/* fusion */}
        {isNew ? (
          <div className="glass rounded-2xl p-4 text-sm text-white/50">
            برای تنظیم مسیرهای فیوژن، اول کارت را بساز و ذخیره کن.
          </div>
        ) : (
          selected && (
            <AdminFusionEditor
              key={selected.id}
              species={selected}
              allSpecies={species}
              resources={resources}
            />
          )
        )}
      </div>

      <style jsx global>{`
        .inp {
          width: 100%;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.5rem 0.75rem;
          outline: none;
        }
        .inp:focus {
          box-shadow: 0 0 0 2px rgb(167 139 250);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-white/50 mb-1">{label}</span>
      {children}
    </label>
  );
}

function ImageEditor({ species }: { species: AdminSpecies }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [url, setUrl] = useState(species.imageUrl ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  function submit(clear: boolean) {
    setMsg(null);
    const fd = new FormData();
    fd.set("speciesId", species.id);
    const file = fileRef.current?.files?.[0];
    if (!clear && file && file.size > 0) {
      fd.set("file", file);
    } else {
      fd.set("imageUrl", clear ? "" : url);
    }
    startTransition(async () => {
      const res = await adminUploadImage(fd);
      setMsg({ ok: res.ok, text: res.ok ? res.message ?? "ذخیره شد" : res.error ?? "خطا" });
      if (res.ok) {
        if (clear) setUrl("");
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      }
    });
  }

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="font-bold text-sm">عکس مربعی کارت</div>
      <div className="flex items-center gap-3">
        <CardThumb
          imageUrl={species.imageUrl}
          icon={species.icon}
          alt={species.nameFa}
          size="w-20 h-20"
        />
        <div className="text-xs text-white/50">
          {species.imageUrl ? "عکس فعلی" : "بدون عکس (آیکن نمایش داده می‌شود)"}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-white/50">آپلود فایل عکس</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-500/30 file:px-3 file:py-1.5 file:text-white"
        />
        <label className="block text-xs text-white/50 mt-2">یا آدرس URL عکس</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://... یا /uploads/..."
          className="w-full rounded-xl bg-white/5 px-3 py-2 outline-none focus:ring-2 ring-violet-400 text-sm"
        />
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

      <div className="flex gap-2">
        <button onClick={() => submit(false)} disabled={pending} className="btn btn-primary text-sm">
          {pending ? "..." : "💾 ذخیره عکس"}
        </button>
        {species.imageUrl && (
          <button onClick={() => submit(true)} disabled={pending} className="btn btn-ghost text-sm">
            حذف عکس
          </button>
        )}
      </div>
    </div>
  );
}
