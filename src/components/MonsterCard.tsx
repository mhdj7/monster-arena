import { CardView } from "@/lib/game/queries";
import { ATTRIBUTE_LABELS_FA } from "@/lib/game/constants";

const STAT_ROWS: {
  off: "power" | "speed" | "intelligence";
  def: "defense" | "evasion" | "accuracy";
}[] = [
  { off: "power", def: "defense" },
  { off: "speed", def: "evasion" },
  { off: "intelligence", def: "accuracy" },
];

const OFF_ICON: Record<string, string> = {
  power: "💪",
  speed: "💨",
  intelligence: "🧠",
};
const DEF_ICON: Record<string, string> = {
  defense: "🛡️",
  evasion: "🌀",
  accuracy: "🎯",
};

export function MonsterCard({
  card,
  selected,
  compact,
  onClick,
  footer,
}: {
  card: CardView;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
  footer?: React.ReactNode;
}) {
  const r = card.species.rarity;
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-3 glass ring-rarity-${r} transition-all ${
        onClick ? "cursor-pointer hover:-translate-y-0.5" : ""
      } ${selected ? "outline outline-2 outline-violet-400" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div className="text-4xl leading-none">{card.species.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold truncate">{card.species.nameFa}</span>
            <span className={`text-xs rarity-${r}`}>● {card.species.rarityFa}</span>
          </div>
          <div className="text-xs text-white/60 flex items-center gap-2 mt-0.5">
            <span>سطح {card.level}</span>
            <span>•</span>
            <span>قدرت کل {card.power}</span>
          </div>
        </div>
        {selected && <span className="text-violet-300 text-xl">✓</span>}
      </div>

      {!compact && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
            {STAT_ROWS.map((row) => (
              <FragmentRow key={row.off} card={card} row={row} />
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1" title="انرژی">
              ⚡
              <div className="flex gap-0.5">
                {Array.from({ length: card.maxEnergy }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-3 rounded-sm ${
                      i < card.energy ? "bg-yellow-400" : "bg-white/15"
                    }`}
                  />
                ))}
              </div>
              <span className="text-white/50">
                {card.energy}/{card.maxEnergy}
              </span>
            </div>
            {card.fatigue > 0 && (
              <span className="text-rose-300" title="خستگی">
                😓 خستگی {card.fatigue}
              </span>
            )}
          </div>
        </>
      )}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}

function FragmentRow({
  card,
  row,
}: {
  card: CardView;
  row: { off: "power" | "speed" | "intelligence"; def: "defense" | "evasion" | "accuracy" };
}) {
  return (
    <>
      <div className="flex items-center justify-between bg-white/5 rounded-lg px-2 py-1">
        <span className="text-white/70">
          {OFF_ICON[row.off]} {ATTRIBUTE_LABELS_FA[row.off]}
        </span>
        <span className="font-bold text-rose-200">{card.stats[row.off]}</span>
      </div>
      <div className="flex items-center justify-between bg-white/5 rounded-lg px-2 py-1">
        <span className="text-white/70">
          {DEF_ICON[row.def]} {ATTRIBUTE_LABELS_FA[row.def]}
        </span>
        <span className="font-bold text-sky-200">{card.stats[row.def]}</span>
      </div>
    </>
  );
}
