import { cookies } from "next/headers";
import { createHash } from "crypto";

// Creator-only admin gate.
// The admin password is read from the ADMIN_PASSWORD env var (set it in .env).
// A default is provided for local convenience — change it for any real use.
const DEFAULT_PASSWORD = "monster-admin";

export const ADMIN_COOKIE = "mna_admin";

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

// Stateless token = hash of the current password. If the password changes,
// existing cookies become invalid automatically.
export function adminToken(): string {
  return createHash("sha256")
    .update(`monster-arena::${adminPassword()}`)
    .digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === adminToken();
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("دسترسی مجاز نیست — فقط سازنده بازی.");
  }
}
