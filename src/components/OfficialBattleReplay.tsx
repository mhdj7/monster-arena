"use client";

import { useEffect, useMemo, useState } from "react";
import { OfficialResult } from "@/lib/game/battle";
import { FightResponse } from "@/app/actions";
import { CardThumb } from "@/components/MonsterCard";

type FlatEvent = { matchup: number; clashIndex: number };

export function OfficialBattleReplay({
  data,
  onClose,
}: {
  data: FightResponse;
  onClose: () => void;
}) {
  const official = data.official as OfficialResult;
  const matchups = official.matchups;

  // Flatten all clashes across the 3 matchups into a single timeline.
  const events = useMemo<FlatEvent[]>(() => {
    const out: FlatEvent[] = [];
    matchups.forEach((m, mi) => {
      m.result.log.forEach((_, ci) => out.push({ matchup: mi, clashIndex: ci }));
    });
    return out;
  }, [matchups]);

  const [step, setStep] = useState(0);
  const done = step >= events.length;

  useEffect(() => {
    if (step >= events.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 850);
    return () => clearTimeout(t);
  }, [step, events.length]);

  function skip() {
    setStep(events.length);
  }

  const current = events[Math.min(step, events.length - 1)];
  const activeMatchup = done ? matchups.length - 1 : current?.matchup ?? 0;

  // How many clashes of matchup `mi` have been revealed so far.
  function revealedClashes(mi: number): number {
    if (done) return matchups[mi].result.log.length;
    let count = 0;
    for (let i = 0; i < step; i++) {
      if (events[i].matchup === mi) count++;
    }
    return count;
  }

  function matchupDone(mi: number): boolean {
    return revealedClashes(mi) >= matchups[mi].result.log.length;
  }

  const winsSelf = matchups.filter((m, mi) => matchupDone(mi) && m.winner === "self").length;
  const winsOpp = matchups.filter((m, mi) => matchupDone(mi) && m.winner === "opp").length;
  const teamWin = official.winner === "self";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass rounded-2xl p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Team scoreboard */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-center flex-1">
            <div className="text-xs text-white/50">تو</div>
            <div className="text-3xl font-extrabold text-emerald-300">{winsSelf}</div>
          </div>
          <div className="text-white/40 text-sm font-bold">
            بردِ مبارزات
            <div className="text-white/30 text-[11px]">از ۳ مبارزه</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-xs text-white/50 truncate">{data.opponentName}</div>
            <div className="text-3xl font-extrabold text-rose-300">{winsOpp}</div>
          </div>
        </div>

        {/* Matchups */}
        <div className="mt-4 space-y-2">
          {matchups.map((m, mi) => {
            const isActive = !done && mi === activeMatchup;
            const finished = matchupDone(mi);
            const revealed = revealedClashes(mi);
            const log = m.result.log;
            const shownLog = log.slice(0, revealed);
            const last = shownLog[shownLog.length - 1];
            const selfScore = finished ? m.result.scoreSelf : last?.scoreSelf ?? 0;
            const oppScore = finished ? m.result.scoreOpp : last?.scoreOpp ?? 0;

            return (
              <div
                key={m.index}
                className={`rounded-xl p-3 transition-all ${
                  isActive
                    ? "bg-white/10 ring-2 ring-violet-400/60"
                    : finished
                      ? "bg-white/5"
                      : "bg-white/5 opacity-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] text-white/40 w-10">مبارزه {m.index}</span>
                    <CardThumb
                      imageUrl={m.self.imageUrl}
                      icon={m.self.icon}
                      alt={m.self.nameFa}
                      size="w-8 h-8"
                    />
                    <span className="text-sm truncate text-emerald-200">{m.self.nameFa}</span>
                  </div>
                  <div className="text-sm font-extrabold whitespace-nowrap">
                    <span className="text-emerald-300">{selfScore}</span>
                    <span className="text-white/30"> - </span>
                    <span className="text-rose-300">{oppScore}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 justify-end">
                    <span className="text-sm truncate text-rose-200">{m.opp.nameFa}</span>
                    <CardThumb
                      imageUrl={m.opp.imageUrl}
                      icon={m.opp.icon}
                      alt={m.opp.nameFa}
                      size="w-8 h-8"
                    />
                  </div>
                </div>

                {/* clash detail (only on active matchup while playing) */}
                {isActive && last && (
                  <div className="mt-2 text-xs text-center text-white/70 bg-black/20 rounded-lg py-1.5 animate-pulse">
                    {last.attackerIcon} {last.attackAttrFa} {last.attackValue} ⚔️{" "}
                    {last.defenseValue} {last.defenseAttrFa} —{" "}
                    <span className={last.winnerSide === "self" ? "text-emerald-300" : "text-rose-300"}>
                      {last.winnerSide === "self" ? "+تو" : "+حریف"}
                    </span>
                  </div>
                )}

                {/* matchup verdict */}
                {finished && (
                  <div className="mt-2 text-xs text-center">
                    {m.winner === "self" ? (
                      <span className="text-emerald-300">🏆 این مبارزه را بردی</span>
                    ) : (
                      <span className="text-rose-300">💥 این مبارزه را باختی</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Result / controls */}
        {done ? (
          <div className="mt-4">
            <div
              className={`rounded-xl p-4 text-center font-extrabold text-xl ${
                teamWin ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
              }`}
            >
              {teamWin
                ? `🏆 پیروز شدی! (${official.winsSelf} از ۳)`
                : `💀 شکست خوردی (${official.winsSelf} از ۳)`}
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
