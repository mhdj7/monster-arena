import Link from "next/link";
import { getGameState, getYou } from "@/lib/game/queries";

export async function TopBar() {
  const [you, state] = await Promise.all([getYou(), getGameState()]);
  return (
    <header className="sticky top-0 z-30 glass">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🐉</span>
          <span className="font-extrabold text-lg tracking-tight">
            مانستر آرنا
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 text-sm">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 font-bold flex items-center gap-1">
            🪙 {you.gold.toLocaleString("fa-IR")}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-violet-500/15 text-violet-200 font-bold flex items-center gap-1">
            {you.league.icon} لیگ {you.league.nameFa}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-200 font-bold flex items-center gap-1">
            ⭐ {you.leaguePoints}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white/5 font-bold flex items-center gap-1">
            📅 روز {state.day}
          </span>
        </div>
      </div>
    </header>
  );
}
