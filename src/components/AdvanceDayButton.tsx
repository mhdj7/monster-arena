"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { advanceDay, AdvanceDayResponse } from "@/app/actions";

export function AdvanceDayButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<AdvanceDayResponse | null>(null);

  function onClick() {
    startTransition(async () => {
      const res = await advanceDay();
      setReport(res);
      router.refresh();
    });
  }

  return (
    <>
      <button onClick={onClick} disabled={pending} className="btn btn-gold">
        {pending ? "..." : "🌙 پایان روز / روز بعد"}
      </button>

      {report && (report.weeklyBox || report.monthly) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setReport(null)}
        >
          <div
            className="glass rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">🎁 رویدادهای روز {report.day}</h3>
            {report.weeklyBox && (
              <div className="mb-4 rounded-xl bg-amber-500/10 p-3">
                <div className="font-bold text-amber-300 mb-2">📦 جعبه پاداش هفتگی</div>
                <div className="text-sm">🪙 {report.weeklyBox.gold} سکه</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {report.weeklyBox.rewards.map((r, i) => (
                    <span key={i} className="text-sm bg-white/5 rounded-lg px-2 py-1">
                      {r.icon} {r.nameFa} ×{r.qty}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {report.monthly && (
              <div className="rounded-xl bg-violet-500/10 p-3">
                <div className="font-bold text-violet-200 mb-1">🏆 آپدیت ماهانه لیگ</div>
                <div className="text-sm">
                  {report.monthly.direction === "up" && "🔼 صعود به لیگ بالاتر!"}
                  {report.monthly.direction === "stay" && "➡️ در همان لیگ ماندی."}
                  {report.monthly.direction === "down" && "🔽 نزول به لیگ پایین‌تر."}
                  {" — "}لیگ جدید: {report.monthly.newLeague}
                </div>
              </div>
            )}
            <button onClick={() => setReport(null)} className="btn btn-ghost mt-4 w-full">
              باشه
            </button>
          </div>
        </div>
      )}
    </>
  );
}
