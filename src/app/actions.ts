"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  ATTRIBUTE_KEYS,
  AttributeKey,
  RESOURCES,
  TUNING,
} from "@/lib/game/constants";
import { applyXp, effectiveStats, maxEnergy } from "@/lib/game/stats";
import {
  BattleCard,
  BattleResult,
  OfficialResult,
  simulateBattle,
  simulateOfficial,
} from "@/lib/game/battle";
import { getFusionOptions, getGameState, getYouId } from "@/lib/game/queries";

export async function loadFusionForCard(cardId: string) {
  return getFusionOptions(cardId);
}

type CardWithSpecies = Awaited<
  ReturnType<typeof db.monsterCard.findFirstOrThrow>
> & { species: Awaited<ReturnType<typeof db.monsterSpecies.findFirstOrThrow>> };

function toBattleCard(card: CardWithSpecies): BattleCard {
  return {
    name: card.species.name,
    nameFa: card.species.nameFa,
    icon: card.species.icon,
    imageUrl: card.species.imageUrl,
    stats: effectiveStats(card),
  };
}

function cap(attr: string): string {
  return attr.charAt(0).toUpperCase() + attr.slice(1);
}

function rand(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// Generate resource rewards: `n` random resources with given quantity range.
function rollResources(n: number, min: number, max: number) {
  const out: { key: string; qty: number }[] = [];
  const pool = [...RESOURCES];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const r = pool.splice(idx, 1)[0];
    out.push({ key: r.key, qty: rand(min, max) });
  }
  return out;
}

async function grantResources(playerId: string, rewards: { key: string; qty: number }[]) {
  const enriched: { key: string; nameFa: string; icon: string; qty: number }[] = [];
  for (const rw of rewards) {
    const rt = await db.resourceType.findUnique({ where: { key: rw.key } });
    if (!rt) continue;
    await db.resourceStack.upsert({
      where: { playerId_resourceTypeId: { playerId, resourceTypeId: rt.id } },
      update: { quantity: { increment: rw.qty } },
      create: { playerId, resourceTypeId: rt.id, quantity: rw.qty },
    });
    enriched.push({ key: rt.key, nameFa: rt.nameFa, icon: rt.icon, qty: rw.qty });
  }
  return enriched;
}

export type FightResponse = {
  ok: boolean;
  error?: string;
  mode?: "official" | "underground";
  result?: BattleResult;
  official?: OfficialResult;
  opponentName?: string;
  rewardGold?: number;
  rewards?: { key: string; nameFa: string; icon: string; qty: number }[];
  leaguePointsDelta?: number;
  levelUps?: { name: string; level: number }[];
};

async function pickOpponent(youLeague: number, needTeam: number) {
  // Prefer a bot in same league with enough monsters, else nearest league.
  const bots = await db.player.findMany({
    where: { isBot: true },
    include: { monsters: { include: { species: true } } },
  });
  const eligible = bots.filter((b) => b.monsters.length >= needTeam);
  if (eligible.length === 0) return null;
  eligible.sort(
    (a, b) =>
      Math.abs(a.leagueLevel - youLeague) - Math.abs(b.leagueLevel - youLeague)
  );
  const nearest = Math.abs(eligible[0].leagueLevel - youLeague);
  const sameBand = eligible.filter(
    (b) => Math.abs(b.leagueLevel - youLeague) <= nearest + 1
  );
  return sameBand[Math.floor(Math.random() * sameBand.length)];
}

export async function fightOfficial(teamIds: string[]): Promise<FightResponse> {
  if (teamIds.length !== 3) {
    return { ok: false, error: "باید دقیقاً ۳ هیولا انتخاب کنی." };
  }
  if (new Set(teamIds).size !== 3) {
    return { ok: false, error: "هر هیولا فقط یک‌بار قابل انتخابه." };
  }
  const youId = await getYouId();
  const state = await getGameState();
  const you = await db.player.findUniqueOrThrow({ where: { id: youId } });
  if (you.lastOfficialDay >= state.day) {
    return { ok: false, error: "مبارزه رسمی امروزت رو انجام دادی. روز رو جلو ببر." };
  }

  const cards = (await db.monsterCard.findMany({
    where: { id: { in: teamIds }, ownerId: youId },
    include: { species: true },
  })) as CardWithSpecies[];
  if (cards.length !== 3) {
    return { ok: false, error: "هیولاهای انتخابی معتبر نیستند." };
  }

  const opponent = await pickOpponent(you.leagueLevel, 3);
  if (!opponent) return { ok: false, error: "حریفی پیدا نشد." };

  // Preserve the player's chosen order (card[0] vs opp[0], etc.).
  const orderedCards = teamIds
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is CardWithSpecies => Boolean(c));
  const selfTeam = orderedCards.map(toBattleCard);
  const oppTeam = (opponent.monsters as CardWithSpecies[]).slice(0, 3).map(toBattleCard);
  const official = simulateOfficial(selfTeam, oppTeam);
  const win = official.winner === "self";

  // rewards
  let rewardGold = 0;
  let rewards: { key: string; nameFa: string; icon: string; qty: number }[] = [];
  let leaguePointsDelta = 0;
  if (win) {
    rewardGold = TUNING.officialWinGold();
    rewards = await grantResources(youId, rollResources(2, 1, 3));
    leaguePointsDelta = 20 + rand(0, 10);
  } else {
    rewardGold = TUNING.officialLossGold();
    leaguePointsDelta = -(5 + rand(0, 8));
  }

  await db.player.update({
    where: { id: youId },
    data: {
      gold: { increment: rewardGold },
      leaguePoints: { increment: leaguePointsDelta },
      lastOfficialDay: state.day,
    },
  });
  // bot also earns some league points
  await db.player.update({
    where: { id: opponent.id },
    data: { leaguePoints: { increment: win ? rand(2, 6) : rand(8, 14) } },
  });

  // XP for participating monsters
  const levelUps = await awardXp(cards, win ? TUNING.officialWinXp : TUNING.officialLossXp);

  await db.battle.create({
    data: {
      playerId: youId,
      type: "OFFICIAL",
      result: win ? "WIN" : "LOSS",
      opponentName: opponent.name,
      scoreSelf: official.winsSelf,
      scoreOpp: official.winsOpp,
      rewardGold,
      rewardJson: JSON.stringify(rewards),
      log: JSON.stringify(official.matchups),
      day: state.day,
    },
  });

  revalidatePath("/");
  revalidatePath("/battle");
  revalidatePath("/leaderboard");
  return {
    ok: true,
    mode: "official",
    official,
    opponentName: opponent.name,
    rewardGold,
    rewards,
    leaguePointsDelta,
    levelUps,
  };
}

export async function fightUnderground(cardId: string): Promise<FightResponse> {
  const youId = await getYouId();
  const state = await getGameState();
  const card = (await db.monsterCard.findFirst({
    where: { id: cardId, ownerId: youId },
    include: { species: true },
  })) as CardWithSpecies | null;
  if (!card) return { ok: false, error: "هیولا پیدا نشد." };
  if (card.energy < TUNING.undergroundEnergyCost) {
    return { ok: false, error: "انرژی این هیولا کافی نیست." };
  }
  const you = await db.player.findUniqueOrThrow({ where: { id: youId } });
  const opponent = await pickOpponent(you.leagueLevel, 1);
  if (!opponent) return { ok: false, error: "حریفی پیدا نشد." };
  const oppMonsters = opponent.monsters as CardWithSpecies[];
  const oppCard = oppMonsters[Math.floor(Math.random() * oppMonsters.length)];

  const result = simulateBattle([toBattleCard(card)], [toBattleCard(oppCard)]);
  const win = result.winner === "self";

  // consume energy + add fatigue
  await db.monsterCard.update({
    where: { id: card.id },
    data: {
      energy: { decrement: TUNING.undergroundEnergyCost },
      fatigue: { increment: TUNING.undergroundFatigue },
    },
  });

  let rewardGold = 0;
  let rewards: { key: string; nameFa: string; icon: string; qty: number }[] = [];
  if (win) {
    rewardGold = TUNING.undergroundWinGold();
    rewards = await grantResources(youId, rollResources(1, 1, 2));
    await db.player.update({
      where: { id: youId },
      data: { gold: { increment: rewardGold } },
    });
  }
  const levelUps = await awardXp(
    [card],
    win ? TUNING.undergroundWinXp : TUNING.undergroundLossXp
  );

  await db.battle.create({
    data: {
      playerId: youId,
      type: "UNDERGROUND",
      result: win ? "WIN" : "LOSS",
      opponentName: opponent.name,
      scoreSelf: result.scoreSelf,
      scoreOpp: result.scoreOpp,
      rewardGold,
      rewardJson: JSON.stringify(rewards),
      log: JSON.stringify(result.log),
      day: state.day,
    },
  });

  revalidatePath("/");
  revalidatePath("/battle");
  return { ok: true, mode: "underground", result, opponentName: opponent.name, rewardGold, rewards, levelUps };
}

// Award XP to a set of cards and persist level/xp/energy. Returns level-up notices.
async function awardXp(cards: CardWithSpecies[], xp: number) {
  const levelUps: { name: string; level: number }[] = [];
  for (const c of cards) {
    const res = applyXp(c.level, c.xp, xp);
    const data: Record<string, number> = { level: res.level, xp: res.xp };
    if (res.levelsGained > 0) {
      // top up energy by the gained max-energy capacity
      data.energy = Math.min(maxEnergy(res.level), c.energy + res.levelsGained);
      levelUps.push({ name: c.species.nameFa, level: res.level });
    }
    await db.monsterCard.update({ where: { id: c.id }, data });
  }
  return levelUps;
}

export type ActionResponse = { ok: boolean; error?: string; message?: string };

export async function trainTemp(
  cardId: string,
  attr: AttributeKey
): Promise<ActionResponse> {
  if (!ATTRIBUTE_KEYS.includes(attr)) return { ok: false, error: "اتریبیوت نامعتبر." };
  const youId = await getYouId();
  const card = await db.monsterCard.findFirst({ where: { id: cardId, ownerId: youId } });
  if (!card) return { ok: false, error: "هیولا پیدا نشد." };
  if (card.energy < TUNING.tempTrainEnergyCost)
    return { ok: false, error: "انرژی کافی نیست." };

  const res = applyXp(card.level, card.xp, TUNING.tempTrainXp);
  await db.monsterCard.update({
    where: { id: cardId },
    data: {
      [`temp${cap(attr)}`]: { increment: TUNING.tempTrainAmount },
      energy: { decrement: TUNING.tempTrainEnergyCost },
      level: res.level,
      xp: res.xp,
    },
  });
  revalidatePath("/");
  revalidatePath("/train");
  return { ok: true, message: `+${TUNING.tempTrainAmount} موقت اضافه شد.` };
}

export async function doFusion(
  cardId: string,
  optionIndex: number
): Promise<ActionResponse & { newSpeciesFa?: string; newIcon?: string }> {
  const youId = await getYouId();
  const card = await db.monsterCard.findFirst({
    where: { id: cardId, ownerId: youId },
    include: { species: true },
  });
  if (!card) return { ok: false, error: "هیولا پیدا نشد." };

  const recipe = await db.fusionRecipe.findFirst({
    where: { fromSpeciesId: card.speciesId, optionIndex },
    include: { costs: { include: { resourceType: true } } },
  });
  if (!recipe) return { ok: false, error: "مسیر فیوژن پیدا نشد." };

  // verify resources
  for (const cost of recipe.costs) {
    const stack = await db.resourceStack.findUnique({
      where: {
        playerId_resourceTypeId: { playerId: youId, resourceTypeId: cost.resourceTypeId },
      },
    });
    if (!stack || stack.quantity < cost.quantity) {
      return { ok: false, error: `منبع کافی نیست: ${cost.resourceType.nameFa}` };
    }
  }
  // deduct resources
  for (const cost of recipe.costs) {
    await db.resourceStack.update({
      where: {
        playerId_resourceTypeId: { playerId: youId, resourceTypeId: cost.resourceTypeId },
      },
      data: { quantity: { decrement: cost.quantity } },
    });
  }

  // determine result species
  let resultSpeciesId = recipe.resultSpeciesId;
  if (recipe.isRandom || !resultSpeciesId) {
    const candidates = await db.monsterSpecies.findMany({
      where: { isBase: false, id: { not: card.speciesId } },
    });
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    resultSpeciesId = chosen.id;
  }
  const newSpecies = await db.monsterSpecies.findUniqueOrThrow({
    where: { id: resultSpeciesId },
  });

  await db.monsterCard.update({
    where: { id: cardId },
    data: { speciesId: resultSpeciesId },
  });

  revalidatePath("/");
  revalidatePath("/fusion");
  revalidatePath("/collection");
  return {
    ok: true,
    message: `فیوژن موفق!`,
    newSpeciesFa: newSpecies.nameFa,
    newIcon: newSpecies.icon,
  };
}

export async function buyResource(key: string, qty: number): Promise<ActionResponse> {
  if (qty <= 0) return { ok: false, error: "تعداد نامعتبر." };
  const youId = await getYouId();
  const rt = await db.resourceType.findUnique({ where: { key } });
  if (!rt) return { ok: false, error: "منبع پیدا نشد." };
  const you = await db.player.findUniqueOrThrow({ where: { id: youId } });
  const cost = rt.price * qty;
  if (you.gold < cost) return { ok: false, error: "پول کافی نیست." };

  await db.player.update({ where: { id: youId }, data: { gold: { decrement: cost } } });
  await db.resourceStack.upsert({
    where: { playerId_resourceTypeId: { playerId: youId, resourceTypeId: rt.id } },
    update: { quantity: { increment: qty } },
    create: { playerId: youId, resourceTypeId: rt.id, quantity: qty },
  });
  revalidatePath("/");
  revalidatePath("/shop");
  return { ok: true, message: `${qty} ${rt.nameFa} خریداری شد.` };
}

export async function buyMonster(offerId: string): Promise<ActionResponse> {
  const youId = await getYouId();
  const offer = await db.shopMonsterOffer.findUnique({
    where: { id: offerId },
    include: { species: true },
  });
  if (!offer || !offer.active) return { ok: false, error: "این کارت دیگر موجود نیست." };
  const you = await db.player.findUniqueOrThrow({ where: { id: youId } });
  if (you.gold < offer.price) return { ok: false, error: "پول کافی نیست." };

  await db.player.update({
    where: { id: youId },
    data: { gold: { decrement: offer.price } },
  });
  await db.monsterCard.create({
    data: {
      ownerId: youId,
      speciesId: offer.speciesId,
      level: 1,
      energy: 1 + TUNING.energyPerLevelBonus,
    },
  });
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/collection");
  return { ok: true, message: `${offer.species.nameFa} به کلکسیونت اضافه شد!` };
}

export type AdvanceDayResponse = {
  ok: boolean;
  day: number;
  weeklyBox?: { gold: number; rewards: { nameFa: string; icon: string; qty: number }[] };
  monthly?: { direction: "up" | "stay" | "down"; newLeague: number };
};

export async function advanceDay(): Promise<AdvanceDayResponse> {
  const youId = await getYouId();
  const state = await getGameState();
  const newDay = state.day + 1;

  // Reset all of the human player's monsters: energy -> max, fatigue -> 0, temp buffs cleared
  const myCards = await db.monsterCard.findMany({ where: { ownerId: youId } });
  for (const c of myCards) {
    await db.monsterCard.update({
      where: { id: c.id },
      data: {
        energy: maxEnergy(c.level),
        fatigue: 0,
        tempPower: 0,
        tempDefense: 0,
        tempSpeed: 0,
        tempEvasion: 0,
        tempIntelligence: 0,
        tempAccuracy: 0,
      },
    });
  }

  let weeklyBox: AdvanceDayResponse["weeklyBox"];
  let monthly: AdvanceDayResponse["monthly"];

  // Weekly reward box every 7 days
  if (newDay - state.lastWeekDay >= 7) {
    const gold = rand(150, 400);
    const rewards = await grantResources(youId, rollResources(3, 2, 5));
    await db.player.update({ where: { id: youId }, data: { gold: { increment: gold } } });
    weeklyBox = {
      gold,
      rewards: rewards.map((r) => ({ nameFa: r.nameFa, icon: r.icon, qty: r.qty })),
    };
    await db.gameState.update({ where: { id: 1 }, data: { lastWeekDay: newDay } });
  }

  // Monthly league update every 30 days (30% up / 40% stay / 30% down)
  if (newDay - state.lastMonthDay >= 30) {
    const you = await db.player.findUniqueOrThrow({ where: { id: youId } });
    const roll = Math.random();
    let direction: "up" | "stay" | "down" = "stay";
    let newLeague = you.leagueLevel;
    if (roll < 0.3 && you.leagueLevel < 8) {
      direction = "up";
      newLeague = you.leagueLevel + 1;
    } else if (roll >= 0.7 && you.leagueLevel > 1) {
      direction = "down";
      newLeague = you.leagueLevel - 1;
    }
    await db.player.update({
      where: { id: youId },
      data: { leagueLevel: newLeague, leaguePoints: 0 },
    });
    monthly = { direction, newLeague };
    await db.gameState.update({ where: { id: 1 }, data: { lastMonthDay: newDay } });
  }

  await db.gameState.update({ where: { id: 1 }, data: { day: newDay } });

  revalidatePath("/");
  revalidatePath("/battle");
  revalidatePath("/train");
  revalidatePath("/leaderboard");
  return { ok: true, day: newDay, weeklyBox, monthly };
}
