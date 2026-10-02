import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { InternalRole } from "@/lib/roles";

const SECRET = process.env.AUTH_SECRET || "bapperida-pinrang-secret-key-2026";
const COOKIE_NAME = "bapperida_session";
const MAX_AGE = 60 * 60 * 8; // 8 jam

export type SessionUser = {
  id: string;
  email: string;
  nama: string;
  role: InternalRole;
  opdId?: string | null;
  opdNama?: string | null;
  opdSlug?: string | null;
};

// ---------- password hashing (scrypt) ----------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [algo, salt, hash] = stored.split(":");
    if (algo !== "scrypt" || !salt || !hash) return false;
    const computed = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return computed.length === expected.length && crypto.timingSafeEqual(computed, expected);
  } catch {
    return false;
  }
}

// ---------- signed session token ----------
function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function createToken(user: SessionUser): string {
  const body = JSON.stringify({ ...user, exp: Date.now() + MAX_AGE * 1000 });
  const encoded = Buffer.from(body).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function parseToken(token: string): (SessionUser & { exp: number }) | null {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;
    if (sign(encoded) !== signature) return null;
    const data = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

// ---------- session helpers ----------
export async function createSession(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createToken(user), {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const data = parseToken(token);
  if (!data) return null;
  // refresh data user dari db (status bisa berubah)
  const user = await db.user.findUnique({
    where: { id: data.id },
    include: { opd: { select: { nama: true, slug: true, status: true } } },
  });
  if (!user || user.status !== "AKTIF") return null;
  return {
    id: user.id,
    email: user.email,
    nama: user.nama,
    role: user.role as SessionUser["role"],
    opdId: user.opdId,
    opdNama: user.opd?.nama ?? null,
    opdSlug: user.opd?.slug ?? null,
  };
}

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { opd: { select: { nama: true, slug: true } } },
  });
  if (!user || user.status !== "AKTIF") return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return {
    id: user.id,
    email: user.email,
    nama: user.nama,
    role: user.role as SessionUser["role"],
    opdId: user.opdId,
    opdNama: user.opd?.nama ?? null,
    opdSlug: user.opd?.slug ?? null,
  };
}

// ---------- RBAC guards ----------
export function isInternal(role?: string | null): boolean {
  return role === "ADMIN" || role === "BAPPERIDA" || role === "OPD";
}

export async function requireRole(roles: InternalRole[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
