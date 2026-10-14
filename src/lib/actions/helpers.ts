"use server";

import { db } from "@/lib/db";
import { getSession, hashPassword, type SessionUser } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import type { InternalRole } from "@/lib/roles";
import { hasAnswer as hasDetailValue } from "@/lib/questionnaire";

/** Hitung ulang cache progres pengisian (bukan sumber kebenaran) */
export async function recomputeProgres(penugasanId: string) {
  const penugasan = await db.penugasanOpd.findUnique({
    where: { id: penugasanId },
    include: { pertanyaanTarget: { include: { pertanyaan: true } } },
  });
  if (!penugasan) return;

  const jawaban = await db.jawabanOpd.findFirst({
    where: { penugasanId },
    orderBy: { version: "desc" },
    include: { detail: true },
  });
  const wilayah = await db.wilayah.findMany({ where: { isActive: true }, select: { id: true } });
  const frozen = jawaban && ["DIKIRIM", "TERVERIFIKASI"].includes(jawaban.status);
  const targets = penugasan.pertanyaanTarget.filter(t => t.required && (frozen || t.pertanyaan.isActive));
  const requiredKeys = new Set(targets.flatMap(t => t.pertanyaan.dimensiWilayah ? wilayah.map(w => `${t.pertanyaanId}:${w.id}`) : [`${t.pertanyaanId}:-`]));
  const required = requiredKeys.size;
  const filledKeys = new Set(jawaban?.detail.filter(hasDetailValue).map(d => `${d.pertanyaanId}:${d.wilayahId ?? "-"}`).filter(key => requiredKeys.has(key)));
  const filled = filledKeys.size;
  const percent = required > 0 ? Math.min(100, Math.round((filled / required) * 1000) / 10) : 100;

  await db.progresPengisian.upsert({
    where: { penugasanId },
    create: {
      penugasanId,
      requiredCount: required,
      filledCount: filled,
      percent,
      lastActivityAt: new Date(),
      calculatedAt: new Date(),
    },
    update: {
      requiredCount: required,
      filledCount: filled,
      percent,
      lastActivityAt: new Date(),
      calculatedAt: new Date(),
    },
  });
}

export async function requireInternal(roles: InternalRole[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export { hashPassword };
