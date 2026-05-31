"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminSpecies, AdminResource } from "@/lib/game/queries";
import { adminExportSeed, adminLogout } from "@/app/admin/actions";
import { AdminBalanceList } from "@/components/admin/AdminBalanceList";
import { AdminCardEditor } from "@/components/admin/AdminCardEditor";

export function AdminDashboard({
  species,
  resources,
}: {
  species: AdminSpecies[];
  resources: AdminResource[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"balance" | "editor">("balance");
  const [, startTransition] = useTransition();
  const [exporting, startExport] = useTransition();
  const [exportMsg, setExportMsg] = useState<
    { ok: boolean; text: string; files?: string[] } | null
  >(null);

  function logout() {
    startTransition(async () => {
      await adminLogout();
      router.refresh();
    });
  }

  function exportSeed() {
    setExportMsg(null);
    startExport(async () => {
      const res = await adminExportSeed();
      if (res.ok) {
        setExportMsg({
          ok: true,
          text: `خروجی ساخته شد: ${res.speciesCount ?? 0} کارت و ${res.fusionCount ?? 0} مسیر فیوژن.`,
          files: res.files,
        });
        router.refresh();
      } else {
        setExportMsg({ ok: false, text: res.error ?? "خطا در ساخت خروجی." });
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("balance")}
            className={`btn ${tab === "balance" ? "btn-primary" : "btn-ghost"}`}
          >
            📊 لیست بالانس
          </button>
          <button
            onClick={() => setTab("editor")}
            className={`btn ${tab === "editor" ? "btn-primary" : "btn-ghost"}`}
          >
            🃏 ویرایش / ساخت کارت
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportSeed}
            disabled={exporting}
            className="btn btn-ghost text-sm"
            title="ذخیره‌ی تغییرات کارت‌ها در فایل سید تا بشود روی گیت‌هاب کامیت کرد"
          >
            {exporting ? "در حال ساخت…" : "📤 خروجی برای گیت‌هاب"}
          </button>
          <button onClick={logout} className="btn btn-ghost text-sm">
            خروج از پنل
          </button>
        </div>
      </div>

      {exportMsg && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            exportMsg.ok
              ? "border-green-500/40 bg-green-500/10 text-green-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          <div>{exportMsg.ok ? "✅ " : "⚠️ "}{exportMsg.text}</div>
          {exportMsg.ok && (
            <div className="mt-1 text-xs text-zinc-400 leading-relaxed">
              برای همیشگی‌کردن روی گیت‌هاب، این‌ها را کامیت کن:
              <code className="mx-1 rounded bg-black/30 px-1">
                git add prisma/seed-overrides.json public/cards &amp;&amp; git commit -m
                &quot;update cards&quot; &amp;&amp; git push
              </code>
            </div>
          )}
        </div>
      )}

      {tab === "balance" ? (
        <AdminBalanceList species={species} />
      ) : (
        <AdminCardEditor species={species} resources={resources} />
      )}
    </div>
  );
}
