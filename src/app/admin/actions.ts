"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, copyFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { ATTRIBUTE_KEYS } from "@/lib/game/constants";
import {
  ADMIN_COOKIE,
  adminPassword,
  adminToken,
  requireAdmin,
} from "@/lib/admin";

export type AdminResponse = { ok: boolean; error?: string; message?: string };

function revalidateAll() {
  for (const p of [
    "/",
    "/admin",
    "/collection",
    "/battle",
    "/train",
    "/fusion",
    "/shop",
    "/leaderboard",
  ]) {
    revalidatePath(p);
  }
}

// ---- auth ----

export async function adminLogin(formData: FormData): Promise<AdminResponse> {
  const password = String(formData.get("password") ?? "");
  if (password !== adminPassword()) {
    return { ok: false, error: "رمز عبور اشتباه است." };
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function adminLogout(): Promise<AdminResponse> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  revalidatePath("/admin");
  return { ok: true };
}

// ---- species editing ----

export type SpeciesEditInput = {
  name?: string;
  nameFa?: string;
  icon?: string;
  theme?: string;
  rarity?: string;
  imageUrl?: string | null;
  power?: number;
  defense?: number;
  speed?: number;
  evasion?: number;
  intelligence?: number;
  accuracy?: number;
};

const THEMES = ["old", "tech"];
const RARITIES = ["common", "rare", "epic", "legendary"];

function sanitizeStat(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return undefined;
  return Math.max(1, Math.min(999, n));
}

function buildSpeciesData(input: SpeciesEditInput) {
  const data: Record<string, unknown> = {};
  if (typeof input.name === "string" && input.name.trim()) data.name = input.name.trim();
  if (typeof input.nameFa === "string" && input.nameFa.trim()) data.nameFa = input.nameFa.trim();
  if (typeof input.icon === "string" && input.icon.trim()) data.icon = input.icon.trim();
  if (typeof input.theme === "string" && THEMES.includes(input.theme)) data.theme = input.theme;
  if (typeof input.rarity === "string" && RARITIES.includes(input.rarity)) data.rarity = input.rarity;
  if (input.imageUrl !== undefined) {
    const url = (input.imageUrl ?? "").toString().trim();
    data.imageUrl = url === "" ? null : url;
  }
  for (const attr of ATTRIBUTE_KEYS) {
    const val = sanitizeStat(input[attr]);
    if (val !== undefined) data[attr] = val;
  }
  return data;
}

export async function adminUpdateSpecies(
  id: string,
  input: SpeciesEditInput
): Promise<AdminResponse> {
  await requireAdmin();
  const data = buildSpeciesData(input);
  if (Object.keys(data).length === 0) return { ok: false, error: "چیزی برای ذخیره نیست." };
  try {
    await db.monsterSpecies.update({ where: { id }, data });
  } catch {
    return { ok: false, error: "ذخیره نشد. کارت پیدا نشد." };
  }
  revalidateAll();
  return { ok: true, message: "ذخیره شد." };
}

// Bulk-save attribute edits from the balance list.
export async function adminUpdateSpeciesBulk(
  updates: { id: string; input: SpeciesEditInput }[]
): Promise<AdminResponse> {
  await requireAdmin();
  let count = 0;
  for (const u of updates) {
    const data = buildSpeciesData(u.input);
    if (Object.keys(data).length === 0) continue;
    try {
      await db.monsterSpecies.update({ where: { id: u.id }, data });
      count++;
    } catch {
      // skip invalid row
    }
  }
  revalidateAll();
  return { ok: true, message: `${count} کارت ذخیره شد.` };
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || "monster";
}

export async function adminCreateSpecies(
  input: SpeciesEditInput & { isBase?: boolean }
): Promise<AdminResponse & { id?: string }> {
  await requireAdmin();
  const nameFa = (input.nameFa ?? "").toString().trim();
  const name = (input.name ?? "").toString().trim() || nameFa;
  if (!nameFa && !name) return { ok: false, error: "حداقل یک نام لازم است." };

  // unique key
  let key = slugify(name || nameFa);
  let suffix = 0;
  while (await db.monsterSpecies.findUnique({ where: { key } })) {
    suffix++;
    key = `${slugify(name || nameFa)}_${suffix}`;
  }

  const stat = (v: unknown, d: number) => sanitizeStat(v) ?? d;
  const created = await db.monsterSpecies.create({
    data: {
      key,
      name: name || nameFa,
      nameFa: nameFa || name,
      theme: THEMES.includes(input.theme ?? "") ? input.theme! : "tech",
      rarity: RARITIES.includes(input.rarity ?? "") ? input.rarity! : "common",
      isBase: input.isBase ?? false,
      icon: (input.icon ?? "").toString().trim() || "🐲",
      imageUrl: input.imageUrl ? String(input.imageUrl).trim() || null : null,
      power: stat(input.power, 10),
      defense: stat(input.defense, 10),
      speed: stat(input.speed, 10),
      evasion: stat(input.evasion, 10),
      intelligence: stat(input.intelligence, 10),
      accuracy: stat(input.accuracy, 10),
    },
  });

  // Seed 8 default fusion paths so the new card is usable (1-7 unset, 8 random).
  for (let opt = 1; opt <= 8; opt++) {
    await db.fusionRecipe.create({
      data: {
        fromSpeciesId: created.id,
        optionIndex: opt,
        resultSpeciesId: null,
        isRandom: opt === 8,
      },
    });
  }

  revalidateAll();
  return { ok: true, message: `«${created.nameFa}» ساخته شد.`, id: created.id };
}

export async function adminDeleteSpecies(id: string): Promise<AdminResponse> {
  await requireAdmin();
  const [cardCount, resultCount, offerCount] = await Promise.all([
    db.monsterCard.count({ where: { speciesId: id } }),
    db.fusionRecipe.count({ where: { resultSpeciesId: id } }),
    db.shopMonsterOffer.count({ where: { speciesId: id } }),
  ]);
  if (cardCount > 0)
    return { ok: false, error: "این هیولا در دست بازیکنان است و حذف نمی‌شود." };
  if (resultCount > 0)
    return { ok: false, error: "این هیولا نتیجه‌ی یک مسیر فیوژن است؛ اول آن مسیرها را تغییر بده." };
  if (offerCount > 0)
    return { ok: false, error: "این هیولا در فروشگاه است و حذف نمی‌شود." };

  // delete this species' own fusion recipes (+ their costs via cascade)
  await db.fusionRecipe.deleteMany({ where: { fromSpeciesId: id } });
  await db.monsterSpecies.delete({ where: { id } });
  revalidateAll();
  return { ok: true, message: "حذف شد." };
}

// ---- image upload ----

export async function adminUploadImage(formData: FormData): Promise<AdminResponse & { imageUrl?: string | null }> {
  await requireAdmin();
  const speciesId = String(formData.get("speciesId") ?? "");
  if (!speciesId) return { ok: false, error: "هیولا مشخص نیست." };
  const species = await db.monsterSpecies.findUnique({ where: { id: speciesId } });
  if (!species) return { ok: false, error: "هیولا پیدا نشد." };

  const file = formData.get("file");
  const urlField = (formData.get("imageUrl") ?? "").toString().trim();

  let imageUrl: string | null = null;

  if (file && typeof file === "object" && "arrayBuffer" in file && file.size > 0) {
    const f = file as File;
    if (!f.type.startsWith("image/")) {
      return { ok: false, error: "فایل باید عکس باشد." };
    }
    if (f.size > 4 * 1024 * 1024) {
      return { ok: false, error: "حجم عکس باید کمتر از ۴ مگابایت باشد." };
    }
    const ext = (f.type.split("/")[1] || "png").replace(/[^a-z0-9]/gi, "") || "png";
    const filename = `${species.key}-${Date.now()}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await f.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);
    imageUrl = `/uploads/${filename}`;
  } else {
    // URL field (empty string clears the image)
    imageUrl = urlField === "" ? null : urlField;
  }

  await db.monsterSpecies.update({ where: { id: speciesId }, data: { imageUrl } });
  revalidateAll();
  return { ok: true, message: imageUrl ? "عکس ذخیره شد." : "عکس حذف شد.", imageUrl };
}

// ---- fusion editing ----

export type FusionOptionInput = {
  optionIndex: number;
  resultSpeciesId: string | null;
  isRandom: boolean;
  costs: { resourceKey: string; quantity: number }[];
};

export async function adminUpdateFusions(
  fromSpeciesId: string,
  options: FusionOptionInput[]
): Promise<AdminResponse> {
  await requireAdmin();
  const from = await db.monsterSpecies.findUnique({ where: { id: fromSpeciesId } });
  if (!from) return { ok: false, error: "هیولا پیدا نشد." };

  const resourceTypes = await db.resourceType.findMany();
  const resByKey: Record<string, string> = {};
  for (const r of resourceTypes) resByKey[r.key] = r.id;

  for (const opt of options) {
    if (opt.optionIndex < 1 || opt.optionIndex > 8) continue;
    const isRandom = !!opt.isRandom;
    const resultSpeciesId = isRandom ? null : opt.resultSpeciesId || null;

    const recipe = await db.fusionRecipe.upsert({
      where: {
        fromSpeciesId_optionIndex: {
          fromSpeciesId,
          optionIndex: opt.optionIndex,
        },
      },
      update: { resultSpeciesId, isRandom },
      create: {
        fromSpeciesId,
        optionIndex: opt.optionIndex,
        resultSpeciesId,
        isRandom,
      },
    });

    // replace costs
    await db.fusionCost.deleteMany({ where: { recipeId: recipe.id } });
    for (const c of opt.costs) {
      const resourceTypeId = resByKey[c.resourceKey];
      const qty = Math.max(1, Math.round(Number(c.quantity) || 0));
      if (!resourceTypeId || qty <= 0) continue;
      await db.fusionCost.create({
        data: { recipeId: recipe.id, resourceTypeId, quantity: qty },
      });
    }
  }

  revalidateAll();
  return { ok: true, message: "مسیرهای فیوژن ذخیره شد." };
}

// ---- export to seed ----

// Snapshot the current species + fusion data (and copy chosen images into the
// committed public/cards folder) into prisma/seed-overrides.json so the admin's
// in-game edits can be committed to git and reproduced on every fresh seed.
export async function adminExportSeed(): Promise<
  AdminResponse & { files?: string[]; speciesCount?: number; fusionCount?: number }
> {
  await requireAdmin();

  const cardsDir = path.join(process.cwd(), "public", "cards");
  await mkdir(cardsDir, { recursive: true });

  const allSpecies = await db.monsterSpecies.findMany({ orderBy: { key: "asc" } });

  const speciesOut = [];
  for (const s of allSpecies) {
    let imageUrl = s.imageUrl;
    // Move uploaded images (gitignored /uploads) into committed /cards.
    if (imageUrl && imageUrl.startsWith("/uploads/")) {
      const filename = imageUrl.slice("/uploads/".length);
      const src = path.join(process.cwd(), "public", "uploads", filename);
      const dest = path.join(cardsDir, filename);
      try {
        await copyFile(src, dest);
        imageUrl = `/cards/${filename}`;
        await db.monsterSpecies.update({ where: { id: s.id }, data: { imageUrl } });
      } catch {
        // source file missing — keep the original url as-is
      }
    }
    speciesOut.push({
      key: s.key,
      name: s.name,
      nameFa: s.nameFa,
      theme: s.theme,
      rarity: s.rarity,
      isBase: s.isBase,
      icon: s.icon,
      imageUrl,
      power: s.power,
      defense: s.defense,
      speed: s.speed,
      evasion: s.evasion,
      intelligence: s.intelligence,
      accuracy: s.accuracy,
    });
  }

  const recipes = await db.fusionRecipe.findMany({
    include: { from: true, result: true, costs: { include: { resourceType: true } } },
    orderBy: [{ fromSpeciesId: "asc" }, { optionIndex: "asc" }],
  });

  const fusionsOut = recipes.map((r) => ({
    fromKey: r.from.key,
    optionIndex: r.optionIndex,
    resultKey: r.result?.key ?? null,
    isRandom: r.isRandom,
    costs: r.costs.map((c) => ({ resourceKey: c.resourceType.key, quantity: c.quantity })),
  }));

  const payload = {
    exportedAt: new Date().toISOString(),
    species: speciesOut,
    fusions: fusionsOut,
  };

  const file = path.join(process.cwd(), "prisma", "seed-overrides.json");
  await writeFile(file, JSON.stringify(payload, null, 2) + "\n");

  revalidateAll();
  return {
    ok: true,
    message: "خروجی سید ساخته شد.",
    files: ["prisma/seed-overrides.json", "public/cards/"],
    speciesCount: speciesOut.length,
    fusionCount: fusionsOut.length,
  };
}
