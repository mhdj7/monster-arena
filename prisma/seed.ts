import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  ALL_SPECIES_SEED,
  BASE_MONSTERS,
  RESOURCES,
  TUNING,
} from "../src/lib/game/constants";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const db = new PrismaClient({ adapter });

// Deterministic helper RNG based on a numeric seed.
function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const RARITY_COST: Record<string, { min: number; max: number; count: number }> = {
  common: { min: 2, max: 4, count: 2 },
  rare: { min: 3, max: 6, count: 2 },
  epic: { min: 5, max: 9, count: 3 },
  legendary: { min: 8, max: 14, count: 3 },
};

async function main() {
  console.log("Seeding Monster Arena...");

  // wipe existing data (idempotent re-seed)
  await db.fusionCost.deleteMany();
  await db.fusionRecipe.deleteMany();
  await db.shopMonsterOffer.deleteMany();
  await db.battle.deleteMany();
  await db.resourceStack.deleteMany();
  await db.monsterCard.deleteMany();
  await db.player.deleteMany();
  await db.resourceType.deleteMany();
  await db.monsterSpecies.deleteMany();
  await db.gameState.deleteMany();

  await db.gameState.create({ data: { id: 1, day: 1, lastWeekDay: 1, lastMonthDay: 1 } });

  // Resources
  const resourceByKey: Record<string, string> = {};
  for (const r of RESOURCES) {
    const created = await db.resourceType.create({
      data: { key: r.key, name: r.name, nameFa: r.nameFa, icon: r.icon, price: r.price },
    });
    resourceByKey[r.key] = created.id;
  }

  // Species
  const speciesByKey: Record<string, string> = {};
  for (const s of ALL_SPECIES_SEED) {
    const created = await db.monsterSpecies.create({
      data: {
        key: s.key,
        name: s.name,
        nameFa: s.nameFa,
        theme: s.theme,
        rarity: s.rarity,
        isBase: s.isBase,
        icon: s.icon,
        power: s.power,
        defense: s.defense,
        speed: s.speed,
        evasion: s.evasion,
        intelligence: s.intelligence,
        accuracy: s.accuracy,
      },
    });
    speciesByKey[s.key] = created.id;
  }

  const evolved = ALL_SPECIES_SEED.filter((s) => !s.isBase);

  // Fusion recipes: 8 per species. 1-7 deterministic results, 8 = random.
  for (let si = 0; si < ALL_SPECIES_SEED.length; si++) {
    const s = ALL_SPECIES_SEED[si];
    for (let opt = 1; opt <= 8; opt++) {
      const isRandom = opt === 8;
      let resultId: string | null = null;
      let resultRarity = s.rarity;
      if (!isRandom) {
        // pick an evolved target distinct from self
        let target = evolved[(si * 7 + opt) % evolved.length];
        if (target.key === s.key) target = evolved[(si * 7 + opt + 1) % evolved.length];
        resultId = speciesByKey[target.key];
        resultRarity = target.rarity;
      } else {
        // random option costs scale to legendary
        resultRarity = "epic";
      }

      const recipe = await db.fusionRecipe.create({
        data: {
          fromSpeciesId: speciesByKey[s.key],
          optionIndex: opt,
          resultSpeciesId: resultId,
          isRandom,
        },
      });

      // costs
      const conf = RARITY_COST[resultRarity] ?? RARITY_COST.rare;
      const count = conf.count;
      const chosen = new Set<string>();
      for (let c = 0; c < count; c++) {
        const idx = Math.floor(seeded(si * 100 + opt * 10 + c) * RESOURCES.length);
        let rkey = RESOURCES[idx].key;
        let guard = 0;
        while (chosen.has(rkey) && guard < RESOURCES.length) {
          rkey = RESOURCES[(idx + guard + 1) % RESOURCES.length].key;
          guard++;
        }
        chosen.add(rkey);
        const qty =
          conf.min +
          Math.floor(seeded(si * 7 + opt * 3 + c * 13) * (conf.max - conf.min + 1));
        await db.fusionCost.create({
          data: {
            recipeId: recipe.id,
            resourceTypeId: resourceByKey[rkey],
            quantity: qty,
          },
        });
      }
    }
  }

  // Human player
  const you = await db.player.create({
    data: {
      name: "تو",
      isBot: false,
      gold: TUNING.startingGold,
      leagueLevel: 1,
      leaguePoints: 0,
    },
  });

  // starting resources
  for (const r of RESOURCES) {
    await db.resourceStack.create({
      data: {
        playerId: you.id,
        resourceTypeId: resourceByKey[r.key],
        quantity: TUNING.startingResourcePerType,
      },
    });
  }

  // starting monsters (first few base monsters)
  for (let i = 0; i < TUNING.startingMonsters; i++) {
    const s = BASE_MONSTERS[i % BASE_MONSTERS.length];
    await db.monsterCard.create({
      data: {
        ownerId: you.id,
        speciesId: speciesByKey[s.key],
        level: 1,
        energy: 1 + TUNING.energyPerLevelBonus,
      },
    });
  }

  // Bots across leagues
  const botNames = [
    " شبح‌شکار", "اژدهابان", "تاریک‌سوار", "غول‌کش", "رعدبان",
    "یخ‌مرد", "آتش‌دل", "سایه‌گرد", "توفان‌ران", "سنگ‌دست",
    "نیزه‌دار", "مه‌باز", "خون‌آشام", "ستاره‌باز", "گرگ‌سوار",
    "آهن‌پنجه",
  ];
  let bi = 0;
  for (let league = 1; league <= 8; league++) {
    const botsInLeague = 2;
    for (let k = 0; k < botsInLeague; k++) {
      const name = botNames[bi % botNames.length] + ` ${league}-${k + 1}`;
      bi++;
      const bot = await db.player.create({
        data: {
          name,
          isBot: true,
          gold: 200,
          leagueLevel: league,
          leaguePoints: Math.floor(seeded(bi * 31) * 40) + league * 25,
        },
      });
      // bot monsters scale with league level
      const botLevel = Math.max(1, league * 2 - 1);
      const teamSize = 3;
      for (let m = 0; m < teamSize; m++) {
        const speciesPool = league <= 3 ? ALL_SPECIES_SEED : evolved;
        const sp = speciesPool[Math.floor(seeded(bi * 17 + m * 5) * speciesPool.length)];
        await db.monsterCard.create({
          data: {
            ownerId: bot.id,
            speciesId: speciesByKey[sp.key],
            level: botLevel,
            energy: botLevel + TUNING.energyPerLevelBonus,
          },
        });
      }
    }
  }

  // Shop monster offers (rotating selection of base + some evolved)
  const shopPicks = [
    ...BASE_MONSTERS.slice(4, 8),
    evolved[0],
    evolved[3],
  ];
  for (const s of shopPicks) {
    const price =
      s.rarity === "legendary" ? 2000 : s.rarity === "epic" ? 1200 : s.rarity === "rare" ? 700 : 400;
    await db.shopMonsterOffer.create({
      data: { speciesId: speciesByKey[s.key], price, active: true },
    });
  }

  // Apply admin overrides exported from the admin panel (seed-overrides.json),
  // so balance/card/image/fusion edits made in-game become permanent in git.
  await applyOverrides();

  const counts = {
    species: await db.monsterSpecies.count(),
    resources: await db.resourceType.count(),
    recipes: await db.fusionRecipe.count(),
    players: await db.player.count(),
    cards: await db.monsterCard.count(),
  };
  console.log("Seed complete:", counts);
}

type SpeciesOverride = {
  key: string;
  name: string;
  nameFa: string;
  theme: string;
  rarity: string;
  isBase: boolean;
  icon: string;
  imageUrl: string | null;
  power: number;
  defense: number;
  speed: number;
  evasion: number;
  intelligence: number;
  accuracy: number;
};

type FusionOverride = {
  fromKey: string;
  optionIndex: number;
  resultKey: string | null;
  isRandom: boolean;
  costs: { resourceKey: string; quantity: number }[];
};

type SeedOverrides = {
  species?: SpeciesOverride[];
  fusions?: FusionOverride[];
};

async function applyOverrides() {
  const file = path.join(process.cwd(), "prisma", "seed-overrides.json");
  if (!existsSync(file)) return;

  let data: SeedOverrides;
  try {
    data = JSON.parse(readFileSync(file, "utf8")) as SeedOverrides;
  } catch {
    console.warn("seed-overrides.json is invalid JSON — skipping overrides.");
    return;
  }

  const speciesByKey: Record<string, string> = {};
  for (const s of data.species ?? []) {
    const fields = {
      name: s.name,
      nameFa: s.nameFa,
      theme: s.theme,
      rarity: s.rarity,
      isBase: s.isBase,
      icon: s.icon,
      imageUrl: s.imageUrl ?? null,
      power: s.power,
      defense: s.defense,
      speed: s.speed,
      evasion: s.evasion,
      intelligence: s.intelligence,
      accuracy: s.accuracy,
    };
    const created = await db.monsterSpecies.upsert({
      where: { key: s.key },
      update: fields,
      create: { key: s.key, ...fields },
    });
    speciesByKey[s.key] = created.id;
  }

  const resByKey: Record<string, string> = {};
  for (const r of await db.resourceType.findMany()) resByKey[r.key] = r.id;

  async function speciesId(key: string): Promise<string | null> {
    if (speciesByKey[key]) return speciesByKey[key];
    const found = await db.monsterSpecies.findUnique({ where: { key } });
    if (found) speciesByKey[key] = found.id;
    return found?.id ?? null;
  }

  for (const f of data.fusions ?? []) {
    const fromId = await speciesId(f.fromKey);
    if (!fromId || f.optionIndex < 1 || f.optionIndex > 8) continue;
    const resultId = f.isRandom || !f.resultKey ? null : await speciesId(f.resultKey);

    const recipe = await db.fusionRecipe.upsert({
      where: {
        fromSpeciesId_optionIndex: { fromSpeciesId: fromId, optionIndex: f.optionIndex },
      },
      update: { resultSpeciesId: resultId, isRandom: f.isRandom },
      create: {
        fromSpeciesId: fromId,
        optionIndex: f.optionIndex,
        resultSpeciesId: resultId,
        isRandom: f.isRandom,
      },
    });

    await db.fusionCost.deleteMany({ where: { recipeId: recipe.id } });
    for (const c of f.costs ?? []) {
      const resourceTypeId = resByKey[c.resourceKey];
      const quantity = Math.max(1, Math.round(Number(c.quantity) || 0));
      if (!resourceTypeId || quantity <= 0) continue;
      await db.fusionCost.create({
        data: { recipeId: recipe.id, resourceTypeId, quantity },
      });
    }
  }

  console.log(
    `Applied admin overrides: ${data.species?.length ?? 0} species, ${data.fusions?.length ?? 0} fusion paths.`
  );
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
