"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "خانه", icon: "🏠" },
  { href: "/collection", label: "کلکسیون", icon: "🗂️" },
  { href: "/battle", label: "مبارزه", icon: "⚔️" },
  { href: "/train", label: "تمرین", icon: "🏋️" },
  { href: "/fusion", label: "فیوژن", icon: "🔀" },
  { href: "/shop", label: "فروشگاه", icon: "🛒" },
  { href: "/leaderboard", label: "لیدربورد", icon: "🏆" },
  { href: "/admin", label: "مدیریت", icon: "🛠️" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-[57px] z-20 glass border-t-0">
      <div className="max-w-6xl mx-auto px-2 flex items-center gap-1 overflow-x-auto">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2.5 whitespace-nowrap text-sm font-semibold border-b-2 transition-colors ${
                active
                  ? "border-violet-400 text-violet-200"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              <span className="ml-1">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
