"use server";

import { db } from "@/lib/db";
import { getSession, hashPassword, type SessionUser } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import type { InternalRole } from "@/lib/roles";

function hasDetailValue(detail: {
  valueText: string | null;
  valueNumber: number | null;
  valueDate: Date | null;
  valueBoolean: boolean | null;
}) {
  return (
    (detail.valueText !== null && detail.valueText.trim() !== "") ||
    detail.valueNumber !== null ||
    detail.valueDate !== null ||
    detail.valueBoolean !== null
  );
}

/** Hitung ulang cache progres pengisian (bukan sumber kebenaran) */
export async function recomputeProgres(penugasanId: string) {
  const penugasan = await db.penugasanOpd.findUnique({
    where: { id: penugasanId },
    include: { pertanyaanTarget: { include: { pertanyaan: true } } },
  });
  if (!penugasan) return;

  const wilayahCount = await db.wilayah.count({ where: { isActive: true } });
  let required = 0;
  for (const t of penugasan.pertanyaanTarget) {
    if (!t.required) continue;
    required += t.pertanyaan.dimensiWilayah ? wilayahCount : 1;
  }

  const jawaban = await db.jawabanOpd.findFirst({
    where: { penugasanId },
    orderBy: { version: "desc" },
    include: { detail: true },
  });
  const filled = jawaban ? jawaban.detail.filter(hasDetailValue).length : 0;
  const percent = required > 0 ? Math.min(100, Math.round((filled / required) * 1000) / 10) : 0;

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
