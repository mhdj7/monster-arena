"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminSpecies, AdminResource } from "@/lib/game/queries";
import { adminLogout } from "@/app/admin/actions";
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

  function logout() {
    startTransition(async () => {
      await adminLogout();
      router.refresh();
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
        <button onClick={logout} className="btn btn-ghost text-sm">
          خروج از پنل
        </button>
      </div>

      {tab === "balance" ? (
        <AdminBalanceList species={species} />
      ) : (
        <AdminCardEditor species={species} resources={resources} />
      )}
    </div>
  );
}
