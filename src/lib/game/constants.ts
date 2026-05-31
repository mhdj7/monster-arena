// Core game constants for Monster Arena.

export const ATTRIBUTE_KEYS = [
  "power",
  "defense",
  "speed",
  "evasion",
  "intelligence",
  "accuracy",
] as const;

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];

// Offensive attribute -> the defensive attribute it is compared against.
export const ATTACK_PAIRS: Record<
  "power" | "speed" | "intelligence",
  "defense" | "evasion" | "accuracy"
> = {
  power: "defense",
  speed: "evasion",
  intelligence: "accuracy",
};

export const OFFENSIVE_KEYS = ["power", "speed", "intelligence"] as const;

export const ATTRIBUTE_LABELS_FA: Record<AttributeKey, string> = {
  power: "قدرت",
  defense: "دفاع",
  speed: "سرعت",
  evasion: "فرار",
  intelligence: "هوش",
  accuracy: "دقت",
};

export const ATTRIBUTE_LABELS_EN: Record<AttributeKey, string> = {
  power: "Power",
  defense: "Defense",
  speed: "Speed",
  evasion: "Evasion",
  intelligence: "Intelligence",
  accuracy: "Accuracy",
};

export type SpeciesSeed = {
  key: string;
  name: string;
  nameFa: string;
  theme: "old" | "tech";
  rarity: "common" | "rare" | "epic" | "legendary";
  isBase: boolean;
  icon: string;
  power: number;
  defense: number;
  speed: number;
  evasion: number;
  intelligence: number;
  accuracy: number;
};

// 12 base monsters.
export const BASE_MONSTERS: SpeciesSeed[] = [
  { key: "emberling", name: "Emberling", nameFa: "اخگرزاد", theme: "old", rarity: "common", isBase: true, icon: "🔥", power: 15, defense: 9, speed: 12, evasion: 8, intelligence: 9, accuracy: 11 },
  { key: "aquafin", name: "Aquafin", nameFa: "آب‌شار", theme: "old", rarity: "common", isBase: true, icon: "🐟", power: 9, defense: 12, speed: 11, evasion: 13, intelligence: 10, accuracy: 9 },
  { key: "terrabeast", name: "Terrabeast", nameFa: "سنگ‌تن", theme: "old", rarity: "common", isBase: true, icon: "🪨", power: 13, defense: 16, speed: 6, evasion: 7, intelligence: 8, accuracy: 10 },
  { key: "voltbyte", name: "Voltbyte", nameFa: "ولت‌بایت", theme: "tech", rarity: "rare", isBase: true, icon: "⚡", power: 12, defense: 8, speed: 16, evasion: 11, intelligence: 12, accuracy: 9 },
  { key: "gloombat", name: "Gloombat", nameFa: "شب‌پره", theme: "old", rarity: "common", isBase: true, icon: "🦇", power: 10, defense: 8, speed: 14, evasion: 15, intelligence: 9, accuracy: 8 },
  { key: "verdant", name: "Verdant", nameFa: "سبزدم", theme: "old", rarity: "common", isBase: true, icon: "🌿", power: 9, defense: 13, speed: 8, evasion: 10, intelligence: 14, accuracy: 12 },
  { key: "frostnip", name: "Frostnip", nameFa: "یخ‌چنگ", theme: "old", rarity: "rare", isBase: true, icon: "❄️", power: 11, defense: 11, speed: 10, evasion: 9, intelligence: 13, accuracy: 14 },
  { key: "cyberhound", name: "Cyberhound", nameFa: "سایبرهاند", theme: "tech", rarity: "rare", isBase: true, icon: "🤖", power: 14, defense: 10, speed: 13, evasion: 8, intelligence: 11, accuracy: 12 },
  { key: "stormwing", name: "Stormwing", nameFa: "طوفان‌بال", theme: "old", rarity: "common", isBase: true, icon: "🦅", power: 12, defense: 8, speed: 15, evasion: 13, intelligence: 8, accuracy: 10 },
  { key: "magmaw", name: "Magmaw", nameFa: "مگماو", theme: "old", rarity: "rare", isBase: true, icon: "🌋", power: 17, defense: 12, speed: 7, evasion: 6, intelligence: 9, accuracy: 11 },
  { key: "nanoswarm", name: "Nanoswarm", nameFa: "نانوازدحام", theme: "tech", rarity: "rare", isBase: true, icon: "🐝", power: 10, defense: 9, speed: 13, evasion: 12, intelligence: 15, accuracy: 13 },
  { key: "specter", name: "Specter", nameFa: "شبح", theme: "old", rarity: "rare", isBase: true, icon: "👻", power: 11, defense: 9, speed: 12, evasion: 16, intelligence: 12, accuracy: 8 },
];

// Name pools for procedurally-seeded evolved (fusion-result) species.
const EVOLVED_NAMES: { name: string; nameFa: string; icon: string; theme: "old" | "tech" }[] = [
  { name: "Pyrovern", nameFa: "آتش‌اژدر", icon: "🐉", theme: "old" },
  { name: "Tidewraith", nameFa: "موج‌روح", icon: "🌊", theme: "old" },
  { name: "Gravecrag", nameFa: "صخره‌مرگ", icon: "⛰️", theme: "old" },
  { name: "Voltaron", nameFa: "ولتارون", icon: "🔌", theme: "tech" },
  { name: "Nightshade", nameFa: "سایه‌شب", icon: "🌑", theme: "old" },
  { name: "Thornking", nameFa: "خارشاه", icon: "🌳", theme: "old" },
  { name: "Glaciark", nameFa: "یخ‌سالار", icon: "🧊", theme: "old" },
  { name: "Mechafang", nameFa: "مکافنگ", icon: "🦾", theme: "tech" },
  { name: "Tempestia", nameFa: "تندبادا", icon: "🌪️", theme: "old" },
  { name: "Infernox", nameFa: "دوزخان", icon: "☄️", theme: "old" },
  { name: "Quantumite", nameFa: "کوانتومیت", icon: "🔬", theme: "tech" },
  { name: "Phantasm", nameFa: "خیال‌بند", icon: "💀", theme: "old" },
  { name: "Solarius", nameFa: "خورنده‌خور", icon: "☀️", theme: "old" },
  { name: "Abyssal", nameFa: "ژرفازی", icon: "🦑", theme: "old" },
  { name: "Titanforge", nameFa: "تیتان‌کوره", icon: "🛡️", theme: "tech" },
  { name: "Plasmaw", nameFa: "پلاسماو", icon: "🟣", theme: "tech" },
  { name: "Venomire", nameFa: "زهرگین", icon: "🐍", theme: "old" },
  { name: "Aurorex", nameFa: "شفق‌رکس", icon: "🌈", theme: "tech" },
  { name: "Doomdrake", nameFa: "نهیب‌اژدها", icon: "🐲", theme: "old" },
  { name: "Cryoblade", nameFa: "یخ‌تیغ", icon: "🗡️", theme: "old" },
  { name: "Stargolem", nameFa: "ستاره‌گولم", icon: "✨", theme: "tech" },
  { name: "Hellraiser", nameFa: "جهنم‌خیز", icon: "🔱", theme: "old" },
  { name: "Chronovore", nameFa: "زمان‌خوار", icon: "⏳", theme: "tech" },
  { name: "Celestion", nameFa: "آسمانی", icon: "👑", theme: "tech" },
];

export type EvolvedSpec = SpeciesSeed;

// Build evolved species with stats scaled by tier.
export function buildEvolvedSpecies(): EvolvedSpec[] {
  const rarities: ("rare" | "epic" | "legendary")[] = ["rare", "epic", "legendary"];
  return EVOLVED_NAMES.map((n, i) => {
    const tier = Math.floor(i / 8); // 0,1,2
    const rarity = rarities[tier];
    const base = 16 + tier * 6; // average stat baseline grows with tier
    // deterministic pseudo-random spread per species
    const spread = (seed: number) => ((Math.sin((i + 1) * (seed + 3)) + 1) / 2) * 10 - 2;
    const mk = (s: number) => Math.max(6, Math.round(base + spread(s)));
    return {
      key: `evo_${n.name.toLowerCase()}`,
      name: n.name,
      nameFa: n.nameFa,
      theme: n.theme,
      rarity,
      isBase: false,
      icon: n.icon,
      power: mk(1),
      defense: mk(2),
      speed: mk(3),
      evasion: mk(4),
      intelligence: mk(5),
      accuracy: mk(6),
    };
  });
}

export const ALL_SPECIES_SEED: SpeciesSeed[] = [
  ...BASE_MONSTERS,
  ...buildEvolvedSpecies(),
];

// 15 resources.
export type ResourceSeed = {
  key: string;
  name: string;
  nameFa: string;
  icon: string;
  price: number;
};

export const RESOURCES: ResourceSeed[] = [
  { key: "gem_shards", name: "Gem Shards", nameFa: "خرده جواهرات", icon: "💎", price: 40 },
  { key: "gold_dust", name: "Gold Dust", nameFa: "گرد طلا", icon: "🌟", price: 35 },
  { key: "crystal", name: "Crystal", nameFa: "کریستال", icon: "🔮", price: 60 },
  { key: "essence", name: "Essence", nameFa: "جوهر", icon: "🧪", price: 50 },
  { key: "elixir", name: "Elixir", nameFa: "الکسیر", icon: "⚗️", price: 80 },
  { key: "life_powder", name: "Life Powder", nameFa: "پودر حیات", icon: "🌸", price: 70 },
  { key: "steel_blade", name: "Steel Blade", nameFa: "تیغه فولادی", icon: "🗡️", price: 55 },
  { key: "legendary_dust", name: "Legendary Dust", nameFa: "گرد افسانه‌ای", icon: "✴️", price: 150 },
  { key: "ancient_stone", name: "Ancient Stone", nameFa: "سنگ باستانی", icon: "🗿", price: 90 },
  { key: "divine_pearl", name: "Divine Pearl", nameFa: "مروارید الهی", icon: "🦪", price: 130 },
  { key: "silver_ingot", name: "Silver Ingot", nameFa: "شمش نقره", icon: "⚪", price: 65 },
  { key: "fire_ruby", name: "Fire Ruby", nameFa: "یاقوت آتش", icon: "🔴", price: 110 },
  { key: "jade_stone", name: "Jade Stone", nameFa: "سنگ یشم", icon: "🟢", price: 75 },
  { key: "acid", name: "Acid", nameFa: "اسید", icon: "🧫", price: 45 },
  { key: "wolf_fang", name: "Wolf Fang", nameFa: "دندان گرگ", icon: "🦷", price: 50 },
];

// 8 league levels (1 = weakest, 8 = strongest).
export const LEAGUES: { level: number; name: string; nameFa: string; icon: string }[] = [
  { level: 1, name: "Bronze", nameFa: "برنز", icon: "🥉" },
  { level: 2, name: "Silver", nameFa: "نقره", icon: "🥈" },
  { level: 3, name: "Gold", nameFa: "طلا", icon: "🥇" },
  { level: 4, name: "Platinum", nameFa: "پلاتین", icon: "💠" },
  { level: 5, name: "Diamond", nameFa: "الماس", icon: "💎" },
  { level: 6, name: "Master", nameFa: "استاد", icon: "🏅" },
  { level: 7, name: "Champion", nameFa: "قهرمان", icon: "🏆" },
  { level: 8, name: "Legend", nameFa: "افسانه", icon: "👑" },
];

export const RARITY_LABEL_FA: Record<string, string> = {
  common: "معمولی",
  rare: "کمیاب",
  epic: "حماسی",
  legendary: "افسانه‌ای",
};

export const RARITY_ORDER: Record<string, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

// Economy / gameplay tuning.
export const TUNING = {
  startingGold: 500,
  startingMonsters: 4,
  startingResourcePerType: 6,
  energyPerLevelBonus: 2, // max energy = level + this
  undergroundEnergyCost: 1,
  undergroundFatigue: 1,
  // training
  tempTrainEnergyCost: 1,
  tempTrainAmount: 4, // temp bonus added to a chosen attribute
  tempTrainXp: 8,
  permTrainEnergyCost: 2,
  permTrainGoldCost: 120,
  permTrainAmount: 2,
  permTrainXp: 25,
  // xp / leveling
  xpPerLevel: (level: number) => 50 + (level - 1) * 30,
  officialWinXp: 40,
  officialLossXp: 15,
  undergroundWinXp: 20,
  undergroundLossXp: 8,
  // rewards
  officialWinGold: () => 120 + Math.floor(Math.random() * 80),
  officialLossGold: () => 20 + Math.floor(Math.random() * 20),
  undergroundWinGold: () => 30 + Math.floor(Math.random() * 30),
  battlePointTarget: 3,
};
