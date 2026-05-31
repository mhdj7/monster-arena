export const dynamic = "force-dynamic";

import Link from "next/link";
import { getBattleHistory, getGameState, getYou } from "@/lib/game/queries";
import { AdvanceDayButton } from "@/components/AdvanceDayButton";

export default async function Home() {
  const [you, state, history] = await Promise.all([
    getYou(),
    getGameState(),
    getBattleHistory(6),
  ]);

  const officialDone = you.lastOfficialDay >= state.day;
  const totalEnergy = you.monsters.reduce((a, m) => a + m.energy, 0);

  const tiles = [
    { href: "/collection", icon: "🗂️", title: "کلکسیون", desc: `${you.monsters.length} هیولا` },
    { href: "/battle", icon: "⚔️", title: "مبارزه", desc: officialDone ? "رسمی: انجام شد" : "رسمی آماده!" },
    { href: "/train", icon: "🏋️", title: "تمرین", desc: `${totalEnergy} انرژی موجود` },
    { href: "/fusion", icon: "🔀", title: "فیوژن", desc: "ارتقا هیولا" },
    { href: "/shop", icon: "🛒", title: "فروشگاه", desc: "خرید منابع و کارت" },
    { href: "/leaderboard", icon: "🏆", title: "لیدربورد", desc: `لیگ ${you.league.nameFa}` },
  ];

  return (
    <div className="space-y-6">
      <section className="glass rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold">خوش اومدی، {you.name}! 🐉</h1>
          <p className="text-white/60 mt-1">
            روز {state.day} • لیگ {you.league.icon} {you.league.nameFa} • {you.leaguePoints} امتیاز
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!officialDone ? (
            <Link href="/battle" className="btn btn-primary">
              ⚔️ مبارزه رسمی امروز
            </Link>
          ) : (
            <span className="text-sm text-emerald-300">✅ مبارزه رسمی امروز انجام شد</span>
          )}
          <AdvanceDayButton />
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="glass rounded-2xl p-4 hover:-translate-y-0.5 transition-transform"
          >
            <div className="text-3xl">{t.icon}</div>
            <div className="font-bold mt-2">{t.title}</div>
            <div className="text-xs text-white/50">{t.desc}</div>
          </Link>
        ))}
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="font-bold mb-3">📜 تاریخچه مبارزات اخیر</h2>
        {history.length === 0 ? (
          <p className="text-white/50 text-sm">هنوز مبارزه‌ای انجام ندادی.</p>
        ) : (
          <div className="space-y-2">
            {history.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between text-sm bg-white/5 rounded-xl px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span>{b.type === "OFFICIAL" ? "⚔️" : "🏚"}</span>
                  <span className="text-white/70">
                    {b.type === "OFFICIAL" ? "رسمی" : "زیرزمینی"} مقابل {b.opponentName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/50">
                    {b.scoreSelf}–{b.scoreOpp}
                  </span>
                  <span className={b.result === "WIN" ? "text-emerald-300" : "text-rose-300"}>
                    {b.result === "WIN" ? "برد" : "باخت"}
                  </span>
                  {b.rewardGold > 0 && <span className="text-amber-300">+{b.rewardGold}🪙</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
