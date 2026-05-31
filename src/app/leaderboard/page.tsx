export const dynamic = "force-dynamic";

import { getLeaderboard, getYou } from "@/lib/game/queries";
import { LEAGUES } from "@/lib/game/constants";

export default async function LeaderboardPage() {
  const [rows, you] = await Promise.all([getLeaderboard(), getYou()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">🏆 لیدربورد و لیگ‌ها</h1>

      <div className="glass rounded-2xl p-4">
        <h2 className="font-bold mb-3">۸ سطح لیگ</h2>
        <div className="flex flex-wrap gap-2">
          {LEAGUES.map((l) => (
            <span
              key={l.level}
              className={`px-3 py-1.5 rounded-xl text-sm ${
                l.level === you.leagueLevel
                  ? "bg-violet-500/25 text-violet-100 font-bold"
                  : "bg-white/5 text-white/60"
              }`}
            >
              {l.icon} {l.level}. {l.nameFa}
            </span>
          ))}
        </div>
        <p className="text-xs text-white/50 mt-3">
          آپدیت ماهانه: ۳۰٪ صعود، ۴۰٪ ماندن، ۳۰٪ نزول — هر ۳۰ روز اعمال می‌شود. جایزه جعبه هفتگی
          هر ۷ روز.
        </p>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="text-right px-4 py-3">رتبه</th>
              <th className="text-right px-4 py-3">بازیکن</th>
              <th className="text-right px-4 py-3">لیگ</th>
              <th className="text-right px-4 py-3">امتیاز</th>
              <th className="text-right px-4 py-3 hidden sm:table-cell">قدرت تیم</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className={`border-t border-white/5 ${
                  !r.isBot ? "bg-violet-500/10 font-bold" : ""
                }`}
              >
                <td className="px-4 py-3">{r.rank}</td>
                <td className="px-4 py-3">
                  {r.isBot ? "🤖" : "⭐"} {r.name}
                </td>
                <td className="px-4 py-3">
                  {r.league.icon} {r.league.nameFa}
                </td>
                <td className="px-4 py-3 text-sky-200">{r.leaguePoints}</td>
                <td className="px-4 py-3 hidden sm:table-cell text-white/60">{r.teamPower}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
