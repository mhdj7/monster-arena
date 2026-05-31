import { db } from "@/lib/db";
import { effectiveStats, maxEnergy, powerScore } from "./stats";
import { LEAGUES, RARITY_LABEL_FA } from "./constants";

export async function getGameState() {
  let state = await db.gameState.findFirst({ where: { id: 1 } });
  if (!state) {
    state = await db.gameState.create({ data: { id: 1 } });
  }
  return state;
}

export async function getYouId(): Promise<string> {
  const you = await db.player.findFirst({ where: { isBot: false } });
  if (!you) throw new Error("Human player not found. Run the seed script.");
  return you.id;
}

export type CardView = {
  id: string;
  level: number;
  xp: number;
  energy: number;
  maxEnergy: number;
  fatigue: number;
  species: {
    key: string;
    name: string;
    nameFa: string;
    icon: string;
    imageUrl: string | null;
    rarity: string;
    rarityFa: string;
    theme: string;
  };
  stats: ReturnType<typeof effectiveStats>;
  power: number;
};

function toCardView(card: {
  id: string;
  level: number;
  xp: number;
  energy: number;
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
  species: {
    key: string;
    name: string;
    nameFa: string;
    icon: string;
    imageUrl: string | null;
    rarity: string;
    theme: string;
    power: number;
    defense: number;
    speed: number;
    evasion: number;
    intelligence: number;
    accuracy: number;
  };
}): CardView {
  const stats = effectiveStats(card);
  return {
    id: card.id,
    level: card.level,
    xp: card.xp,
    energy: card.energy,
    maxEnergy: maxEnergy(card.level),
    fatigue: card.fatigue,
    species: {
      key: card.species.key,
      name: card.species.name,
      nameFa: card.species.nameFa,
      icon: card.species.icon,
      imageUrl: card.species.imageUrl,
      rarity: card.species.rarity,
      rarityFa: RARITY_LABEL_FA[card.species.rarity] ?? card.species.rarity,
      theme: card.species.theme,
    },
    stats,
    power: powerScore(card),
  };
}

export async function getYou() {
  const youId = await getYouId();
  const player = await db.player.findUniqueOrThrow({
    where: { id: youId },
    include: {
      monsters: { include: { species: true }, orderBy: { createdAt: "asc" } },
      inventory: { include: { resourceType: true } },
    },
  });
  const league = LEAGUES.find((l) => l.level === player.leagueLevel) ?? LEAGUES[0];
  return {
    id: player.id,
    name: player.name,
    gold: player.gold,
    leagueLevel: player.leagueLevel,
    league,
    leaguePoints: player.leaguePoints,
    lastOfficialDay: player.lastOfficialDay,
    monsters: player.monsters.map(toCardView),
    inventory: player.inventory
      .map((s) => ({
        key: s.resourceType.key,
        name: s.resourceType.name,
        nameFa: s.resourceType.nameFa,
        icon: s.resourceType.icon,
        price: s.resourceType.price,
        quantity: s.quantity,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function getLeaderboard() {
  const players = await db.player.findMany({
    orderBy: [{ leagueLevel: "desc" }, { leaguePoints: "desc" }],
    include: { monsters: { include: { species: true } } },
  });
  return players.map((p, i) => {
    const league = LEAGUES.find((l) => l.level === p.leagueLevel) ?? LEAGUES[0];
    const teamPower = p.monsters.reduce((acc, c) => acc + powerScore(c), 0);
    return {
      rank: i + 1,
      id: p.id,
      name: p.name,
      isBot: p.isBot,
      leagueLevel: p.leagueLevel,
      league,
      leaguePoints: p.leaguePoints,
      monsterCount: p.monsters.length,
      teamPower,
    };
  });
}

export async function getShop() {
  const offers = await db.shopMonsterOffer.findMany({
    where: { active: true },
    include: { species: true },
  });
  return offers.map((o) => ({
    id: o.id,
    price: o.price,
    species: {
      key: o.species.key,
      name: o.species.name,
      nameFa: o.species.nameFa,
      icon: o.species.icon,
      rarity: o.species.rarity,
      rarityFa: RARITY_LABEL_FA[o.species.rarity] ?? o.species.rarity,
      power: o.species.power,
      defense: o.species.defense,
      speed: o.species.speed,
      evasion: o.species.evasion,
      intelligence: o.species.intelligence,
      accuracy: o.species.accuracy,
    },
  }));
}

// Fusion options for a given owned card.
export async function getFusionOptions(cardId: string) {
  const card = await db.monsterCard.findUnique({
    where: { id: cardId },
    include: { species: true },
  });
  if (!card) return null;
  const recipes = await db.fusionRecipe.findMany({
    where: { fromSpeciesId: card.speciesId },
    orderBy: { optionIndex: "asc" },
    include: {
      result: true,
      costs: { include: { resourceType: true } },
    },
  });
  return {
    card: toCardView(card),
    recipes: recipes.map((r) => ({
      id: r.id,
      optionIndex: r.optionIndex,
      isRandom: r.isRandom,
      result: r.result
        ? {
            name: r.result.name,
            nameFa: r.result.nameFa,
            icon: r.result.icon,
            rarity: r.result.rarity,
            rarityFa: RARITY_LABEL_FA[r.result.rarity] ?? r.result.rarity,
          }
        : null,
      costs: r.costs.map((c) => ({
        key: c.resourceType.key,
        name: c.resourceType.name,
        nameFa: c.resourceType.nameFa,
        icon: c.resourceType.icon,
        quantity: c.quantity,
      })),
    })),
  };
}

// ---- admin data ----

export type AdminSpecies = {
  id: string;
  key: string;
  name: string;
  nameFa: string;
  icon: string;
  imageUrl: string | null;
  theme: string;
  rarity: string;
  isBase: boolean;
  power: number;
  defense: number;
  speed: number;
  evasion: number;
  intelligence: number;
  accuracy: number;
  cardCount: number;
  fusions: {
    optionIndex: number;
    resultSpeciesId: string | null;
    isRandom: boolean;
    costs: { resourceKey: string; quantity: number }[];
  }[];
};

export async function getAdminSpecies(): Promise<AdminSpecies[]> {
  const species = await db.monsterSpecies.findMany({
    orderBy: [{ isBase: "desc" }, { nameFa: "asc" }],
    include: {
      fusionsFrom: {
        orderBy: { optionIndex: "asc" },
        include: { costs: { include: { resourceType: true } } },
      },
      _count: { select: { cards: true } },
    },
  });
  return species.map((s) => ({
    id: s.id,
    key: s.key,
    name: s.name,
    nameFa: s.nameFa,
    icon: s.icon,
    imageUrl: s.imageUrl,
    theme: s.theme,
    rarity: s.rarity,
    isBase: s.isBase,
    power: s.power,
    defense: s.defense,
    speed: s.speed,
    evasion: s.evasion,
    intelligence: s.intelligence,
    accuracy: s.accuracy,
    cardCount: s._count.cards,
    fusions: s.fusionsFrom.map((f) => ({
      optionIndex: f.optionIndex,
      resultSpeciesId: f.resultSpeciesId,
      isRandom: f.isRandom,
      costs: f.costs.map((c) => ({
        resourceKey: c.resourceType.key,
        quantity: c.quantity,
      })),
    })),
  }));
}

export type AdminResource = {
  key: string;
  nameFa: string;
  icon: string;
};

export async function getResourceTypesList(): Promise<AdminResource[]> {
  const list = await db.resourceType.findMany({ orderBy: { name: "asc" } });
  return list.map((r) => ({ key: r.key, nameFa: r.nameFa, icon: r.icon }));
}

export async function getBattleHistory(limit = 15) {
  const youId = await getYouId();
  const battles = await db.battle.findMany({
    where: { playerId: youId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return battles.map((b) => ({
    id: b.id,
    type: b.type,
    result: b.result,
    opponentName: b.opponentName,
    scoreSelf: b.scoreSelf,
    scoreOpp: b.scoreOpp,
    rewardGold: b.rewardGold,
    reward: JSON.parse(b.rewardJson) as { key: string; nameFa: string; icon: string; qty: number }[],
    day: b.day,
    createdAt: b.createdAt,
  }));
}
