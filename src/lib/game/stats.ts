import { ATTRIBUTE_KEYS, AttributeKey, TUNING } from "./constants";

export type SpeciesStats = {
  power: number;
  defense: number;
  speed: number;
  evasion: number;
  intelligence: number;
  accuracy: number;
};

export type CardLike = {
  level: number;
  fatigue: number;
  bonusPower: number;
  bonusDefense: number;
  bonusSpeed: number;
  bonusEvasion: number;
  bonusIntelligence: number;
  bonusAccuracy: number;
  tempPower: number;
  tempDefense: number;
  tempSpeed: number;
  tempEvasion: number;
  tempIntelligence: number;
  tempAccuracy: number;
  species: SpeciesStats;
};

const GROWTH_PER_LEVEL = 2;

// Max energy for a given level.
export function maxEnergy(level: number): number {
  return level + TUNING.energyPerLevelBonus;
}

// Fatigue reduces all stats multiplicatively (each point ~8%, floored at 50%).
export function fatigueMultiplier(fatigue: number): number {
  return Math.max(0.5, 1 - fatigue * 0.08);
}

function capName(attr: AttributeKey): string {
  return attr.charAt(0).toUpperCase() + attr.slice(1);
}

// Effective in-battle stats including level growth, bonuses, temp buffs and fatigue.
export function effectiveStats(card: CardLike): SpeciesStats {
  const mult = fatigueMultiplier(card.fatigue);
  const out = {} as SpeciesStats;
  for (const attr of ATTRIBUTE_KEYS) {
    const base = card.species[attr];
    const growth = (card.level - 1) * GROWTH_PER_LEVEL;
    const perm = card[`bonus${capName(attr)}` as keyof CardLike] as number;
    const temp = card[`temp${capName(attr)}` as keyof CardLike] as number;
    const raw = base + growth + perm + temp;
    out[attr] = Math.max(1, Math.round(raw * mult));
  }
  return out;
}

// Total power score, useful for sorting / matchmaking.
export function powerScore(card: CardLike): number {
  const s = effectiveStats(card);
  return s.power + s.defense + s.speed + s.evasion + s.intelligence + s.accuracy;
}

export function xpToNext(level: number): number {
  return TUNING.xpPerLevel(level);
}

// Apply XP, returning the new level/xp and how many levels gained.
export function applyXp(
  level: number,
  xp: number,
  gained: number
): { level: number; xp: number; levelsGained: number } {
  let newLevel = level;
  let newXp = xp + gained;
  let levelsGained = 0;
  while (newXp >= TUNING.xpPerLevel(newLevel)) {
    newXp -= TUNING.xpPerLevel(newLevel);
    newLevel += 1;
    levelsGained += 1;
  }
  return { level: newLevel, xp: newXp, levelsGained };
}
