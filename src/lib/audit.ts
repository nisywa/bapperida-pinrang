import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

/**
 * Audit trail - mencatat aksi penting append-only.
 * Sesuai dokumen desain: actor, acting context, OPD scope, action,
 * entity, detail, IP, user agent.
 */
export async function logActivity(opts: {
  actor: SessionUser | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  detail?: string;
  ipAddress?: string;
  userAgent?: string;
  publicActor?: boolean;
}) {
  try {
    await db.activityLog.create({
      data: {
        actorUserId: opts.actor?.id ?? null,
        actorNama: opts.actor?.nama ?? (opts.publicActor ? "Masyarakat" : "Anonim"),
        actingRole: opts.actor?.role ?? (opts.publicActor ? "MASYARAKAT" : null),
        opdScopeNama: opts.actor?.opdNama ?? null,
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId ?? null,
        detail: opts.detail ?? null,
        ipAddress: opts.ipAddress ?? null,
        userAgent: opts.userAgent ?? null,
      },
    });
  } catch (e) {
    console.error("Gagal menulis audit log:", e);
  }
}
