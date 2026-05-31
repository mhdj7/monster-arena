"use client";

import { useEffect, useState } from "react";
import { BattleResult } from "@/lib/game/battle";
import { FightResponse } from "@/app/actions";

export function BattleReplay({
  data,
  onClose,
}: {
  data: FightResponse;
  onClose: () => void;
}) {
  const result = data.result as BattleResult;
  const log = result.log;
  const [step, setStep] = useState(0);
  const done = step >= log.length;

  useEffect(() => {
    if (step >= log.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [step, log.length]);

  const shown = log.slice(0, step);
  const current = log[Math.min(step, log.length - 1)];
  const scoreSelf = done ? result.scoreSelf : current?.scoreSelf ?? 0;
  const scoreOpp = done ? result.scoreOpp : current?.scoreOpp ?? 0;
  const win = result.winner === "self";

  function skip() {
    setStep(log.length);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass rounded-2xl p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Scoreboard */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <div className="text-xs text-white/50">تو</div>
            <div className="text-3xl font-extrabold text-emerald-300">{scoreSelf}</div>
          </div>
          <div className="text-white/40 font-bold">vs</div>
          <div className="text-center flex-1">
            <div className="text-xs text-white/50 truncate">{data.opponentName}</div>
            <div className="text-3xl font-extrabold text-rose-300">{scoreOpp}</div>
          </div>
        </div>

        {/* Current clash */}
        {!done && current && (
          <div className="rounded-xl bg-white/5 p-4 text-center animate-pulse">
            <div className="text-sm text-white/60 mb-2">کلش {current.clash}</div>
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className={current.attackerSide === "self" ? "text-emerald-300" : "text-rose-300"}>
                {current.attackerIcon} {current.attackerNameFa}
              </span>
              <span className="text-white/40">حمله می‌کند با</span>
              <span className="font-bold text-amber-300">{current.attackAttrFa}</span>
            </div>
            <div className="mt-2 text-lg font-bold">
              {current.attackValue} <span className="text-white/40 text-sm">({current.attackAttrFa})</span>{" "}
              ⚔️ {current.defenseValue}{" "}
              <span className="text-white/40 text-sm">({current.defenseAttrFa})</span>
            </div>
            <div className="mt-1 text-sm">
              برنده کلش:{" "}
              <span className={current.winnerSide === "self" ? "text-emerald-300" : "text-rose-300"}>
                {current.winnerSide === "self" ? "تو" : data.opponentName}
              </span>
            </div>
          </div>
        )}

        {/* Log list */}
        <div className="mt-4 space-y-1 text-xs">
          {shown.map((c) => (
            <div
              key={c.clash}
              className="flex items-center justify-between bg-white/5 rounded-lg px-2 py-1"
            >
              <span className="text-white/60">
                {c.attackerIcon} {c.attackAttrFa} {c.attackValue} ⚔️ {c.defenseValue} {c.defenseAttrFa}
              </span>
              <span className={c.winnerSide === "self" ? "text-emerald-300" : "text-rose-300"}>
                {c.winnerSide === "self" ? "+تو" : "+حریف"}
              </span>
            </div>
          ))}
        </div>

        {/* Result */}
        {done ? (
          <div className="mt-4">
            <div
              className={`rounded-xl p-4 text-center font-extrabold text-xl ${
                win ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
              }`}
            >
              {win ? "🏆 پیروز شدی!" : "💀 شکست خوردی"}
            </div>
            {(data.rewardGold || (data.rewards && data.rewards.length > 0)) && (
              <div className="mt-3 text-sm text-center space-y-2">
                {data.rewardGold ? (
                  <div className="text-amber-300">🪙 {data.rewardGold} سکه</div>
                ) : null}
                {data.rewards && data.rewards.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {data.rewards.map((r, i) => (
                      <span key={i} className="bg-white/5 rounded-lg px-2 py-1">
                        {r.icon} {r.nameFa} ×{r.qty}
                      </span>
                    ))}
                  </div>
                )}
                {typeof data.leaguePointsDelta === "number" && (
                  <div className={data.leaguePointsDelta >= 0 ? "text-sky-300" : "text-rose-300"}>
                    ⭐ {data.leaguePointsDelta >= 0 ? "+" : ""}
                    {data.leaguePointsDelta} امتیاز لیگ
                  </div>
                )}
                {data.levelUps && data.levelUps.length > 0 && (
                  <div className="text-violet-300">
                    ⬆️ ارتقا سطح: {data.levelUps.map((l) => `${l.name} (${l.level})`).join("، ")}
                  </div>
                )}
              </div>
            )}
            <button onClick={onClose} className="btn btn-primary w-full mt-4">
              ادامه
            </button>
          </div>
        ) : (
          <button onClick={skip} className="btn btn-ghost w-full mt-4">
            رد کردن ⏩
          </button>
        )}
      </div>
    </div>
  );
}
