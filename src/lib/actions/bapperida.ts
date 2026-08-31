"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/audit";
import { requireInternal, recomputeProgres } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/admin";

// ============ PERIODE ============

export async function createPeriode(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["ADMIN", "BAPPERIDA"]);
    const kode = String(formData.get("kode") ?? "").trim();
    const nama = String(formData.get("nama") ?? "").trim();
    const startDate = new Date(String(formData.get("startDate") ?? ""));
    const endDate = new Date(String(formData.get("endDate") ?? ""));
    if (!kode || !nama || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { ok: false, error: "Kode, nama, dan tanggal yang valid wajib diisi." };
    }
    if (endDate <= startDate) return { ok: false, error: "Tanggal akhir harus setelah tanggal mulai." };

    const exists = await db.periodePengisian.findUnique({ where: { kode } });
    if (exists) return { ok: false, error: "Kode periode sudah digunakan." };

    const periode = await db.periodePengisian.create({
      data: { kode, nama, startDate, endDate, status: "AKTIF", createdBy: actor.id },
    });
    await logActivity({ actor, action: "CREATE", entityType: "PeriodePengisian", entityId: periode.id, detail: `Membuat periode ${nama}` });
    revalidatePath("/backoffice/penugasan");
    return { ok: true, message: `Periode ${nama} berhasil dibuat dan aktif.` };
  } catch {
    return { ok: false, error: "Gagal membuat periode." };
  }
}

export async function tutupPeriode(periodeId: string): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["ADMIN", "BAPPERIDA"]);
    const periode = await db.periodePengisian.findUnique({ where: { id: periodeId } });
    if (!periode) return { ok: false, error: "Periode tidak ditemukan." };
    await db.periodePengisian.update({
      where: { id: periodeId },
      data: { status: "DITUTUP", lockAt: new Date() },
    });
    await logActivity({ actor, action: "UPDATE", entityType: "PeriodePengisian", entityId: periodeId, detail: `Menutup periode ${periode.nama}` });
    revalidatePath("/backoffice/penugasan");
    return { ok: true, message: `Periode ${periode.nama} ditutup dan dikunci.` };
  } catch {
    return { ok: false, error: "Gagal menutup periode." };
  }
}

// ============ PENUGASAN ============

export async function createPenugasan(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["ADMIN", "BAPPERIDA"]);
    const periodeId = String(formData.get("periodeId") ?? "");
    const indikatorId = String(formData.get("indikatorId") ?? "");
    const opdIds = formData.getAll("opdIds").map(String);
    const deadline = String(formData.get("deadline") ?? "");

    if (!periodeId || !indikatorId || opdIds.length === 0) {
      return { ok: false, error: "Periode, indikator, dan minimal satu OPD wajib dipilih." };
    }

    const indikator = await db.indikator.findUnique({
      where: { id: indikatorId },
      include: { aspek: { include: { pertanyaan: true } } },
    });
    if (!indikator) return { ok: false, error: "Indikator tidak ditemukan." };

    let created = 0;
    for (const opdId of opdIds) {
      const exists = await db.penugasanOpd.findFirst({ where: { periodeId, indikatorId, opdId } });
      if (exists) continue;
      const penugasan = await db.penugasanOpd.create({
        data: {
          periodeId,
          indikatorId,
          opdId,
          deadline: deadline ? new Date(deadline) : null,
          status: "AKTIF",
        },
      });
      // Semua pertanyaan indikator menjadi target wajib (bisa dipersempit nanti)
      const allQs = indikator.aspek.flatMap((a) => a.pertanyaan);
      for (const q of allQs) {
        await db.penugasanPertanyaan.create({
          data: { penugasanId: penugasan.id, pertanyaanId: q.id, required: true },
        });
      }
      created++;
    }

    await logActivity({
      actor,
      action: "CREATE",
      entityType: "PenugasanOpd",
      detail: `Membuat ${created} penugasan indikator ${indikator.nama}`,
    });
    revalidatePath("/backoffice/penugasan");
    revalidatePath("/backoffice/monitoring");
    return { ok: true, message: `${created} penugasan berhasil dibuat untuk indikator ${indikator.nama}.` };
  } catch {
    return { ok: false, error: "Gagal membuat penugasan." };
  }
}

export async function deletePenugasan(penugasanId: string): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["ADMIN", "BAPPERIDA"]);
    const p = await db.penugasanOpd.findUnique({
      where: { id: penugasanId },
      include: { jawaban: true },
    });
    if (!p) return { ok: false, error: "Penugasan tidak ditemukan." };
    if (p.jawaban.length > 0) {
      return { ok: false, error: "Penugasan sudah memiliki jawaban dan tidak dapat dihapus." };
    }
    await db.penugasanPertanyaan.deleteMany({ where: { penugasanId } });
    await db.progresPengisian.deleteMany({ where: { penugasanId } });
    await db.penugasanOpd.delete({ where: { id: penugasanId } });
    await logActivity({ actor, action: "DELETE", entityType: "PenugasanOpd", entityId: penugasanId, detail: "Menghapus penugasan" });
    revalidatePath("/backoffice/penugasan");
    return { ok: true, message: "Penugasan dihapus." };
  } catch {
    return { ok: false, error: "Gagal menghapus penugasan." };
  }
}

// ============ VERIFIKASI ============

export async function verifikasiJawaban(
  jawabanId: string,
  decision: "TERVERIFIKASI" | "PERLU_PERBAIKAN",
  catatan: string
): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["ADMIN", "BAPPERIDA"]);
    const jawaban = await db.jawabanOpd.findUnique({
      where: { id: jawabanId },
      include: { penugasan: { include: { indikator: true, opd: true } } },
    });
    if (!jawaban) return { ok: false, error: "Data jawaban tidak ditemukan." };
    if (jawaban.status !== "DIKIRIM") {
      return { ok: false, error: "Hanya data berstatus Dikirim yang dapat diverifikasi." };
    }

    await db.jawabanOpd.update({ where: { id: jawabanId }, data: { status: decision } });
    await db.verifikasi.create({
      data: { jawabanId, verifierId: actor.id, status: decision, catatan: catatan || null },
    });
    await db.riwayatStatusJawaban.create({
      data: {
        jawabanId,
        statusFrom: "DIKIRIM",
        statusTo: decision,
        changedBy: actor.id,
        reason: catatan || (decision === "TERVERIFIKASI" ? "Data disetujui" : "Perlu perbaikan"),
      },
    });

    // Notifikasi ke OPD
    const opdUsers = await db.user.findMany({ where: { opdId: jawaban.penugasan.opdId, role: "OPD" } });
    if (opdUsers.length > 0) {
      const notif = await db.notifikasi.create({
        data: {
          type: "VERIFIKASI",
          title:
            decision === "TERVERIFIKASI"
              ? `Data ${jawaban.penugasan.indikator.nama} Terverifikasi`
              : `Data ${jawaban.penugasan.indikator.nama} Perlu Perbaikan`,
          message:
            decision === "TERVERIFIKASI"
              ? "Data Anda telah diverifikasi dan disetujui oleh Bapperida."
              : catatan || "Verifikator memberikan catatan perbaikan pada data Anda.",
          opdId: jawaban.penugasan.opdId,
          penugasanId: jawaban.penugasanId,
          createdBy: actor.id,
        },
      });
      for (const u of opdUsers) {
        await db.notifikasiPenerima.create({ data: { notifikasiId: notif.id, userId: u.id } });
      }
    }

    await logActivity({
      actor,
      action: "VERIFY",
      entityType: "JawabanOpd",
      entityId: jawabanId,
      detail: `Verifikasi ${jawaban.penugasan.indikator.nama} - ${jawaban.penugasan.opd.singkatan}: ${decision}`,
    });
    revalidatePath("/backoffice/verifikasi");
    revalidatePath("/backoffice/monitoring");
    return { ok: true, message: `Data berhasil ditandai ${decision === "TERVERIFIKASI" ? "Terverifikasi" : "Perlu Perbaikan"}.` };
  } catch {
    return { ok: false, error: "Gagal melakukan verifikasi." };
  }
}

// ============ DATASET PUBLIK ============

export async function publishDataset(penugasanId: string, notes: string): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["ADMIN", "BAPPERIDA"]);
    const penugasan = await db.penugasanOpd.findUnique({
      where: { id: penugasanId },
      include: {
        jawaban: { orderBy: { version: "desc" }, take: 1 },
        indikator: true,
      },
    });
    if (!penugasan) return { ok: false, error: "Penugasan tidak ditemukan." };
    const jawaban = penugasan.jawaban[0];
    if (!jawaban || jawaban.status !== "TERVERIFIKASI") {
      return { ok: false, error: "Hanya data TERVERIFIKASI yang dapat dipublikasikan." };
    }

    const priorVersion = await db.datasetPublik.findFirst({
      where: { indikatorId: penugasan.indikatorId, periodeId: penugasan.periodeId },
      orderBy: { version: "desc" },
    });

    const dataset = await db.datasetPublik.create({
      data: {
        indikatorId: penugasan.indikatorId,
        periodeId: penugasan.periodeId,
        version: (priorVersion?.version ?? 0) + 1,
        status: "PUBLISHED",
        publishedAt: new Date(),
        notes: notes || `Snapshot resmi ${penugasan.indikator.nama}`,
      },
    });

    const details = await db.detailJawaban.findMany({
      where: { jawabanId: jawaban.id, wilayahId: { not: null }, valueNumber: { not: null } },
      include: { pertanyaan: true },
    });
    for (const d of details) {
      await db.datasetPublikDetail.create({
        data: {
          datasetId: dataset.id,
          opdId: penugasan.opdId,
          wilayahId: d.wilayahId,
          metricKey: d.pertanyaan.kode,
          metricValue: d.valueNumber,
        },
      });
    }

    await logActivity({
      actor,
      action: "PUBLISH",
      entityType: "DatasetPublik",
      entityId: dataset.id,
      detail: `Mempublikasikan dataset ${penugasan.indikator.nama} v${dataset.version} (${details.length} nilai wilayah)`,
    });
    revalidatePath("/backoffice/dataset");
    revalidatePath("/data");
    return { ok: true, message: `Dataset ${penugasan.indikator.nama} v${dataset.version} berhasil dipublikasikan ke portal publik.` };
  } catch {
    return { ok: false, error: "Gagal mempublikasikan dataset." };
  }
}

export async function unpublishDataset(datasetId: string): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["ADMIN", "BAPPERIDA"]);
    const dataset = await db.datasetPublik.findUnique({ where: { id: datasetId }, include: { indikator: true } });
    if (!dataset) return { ok: false, error: "Dataset tidak ditemukan." };
    await db.datasetPublik.update({ where: { id: datasetId }, data: { status: "UNPUBLISHED" } });
    await logActivity({
      actor,
      action: "UNPUBLISH",
      entityType: "DatasetPublik",
      entityId: datasetId,
      detail: `Menarik dataset ${dataset.indikator.nama} v${dataset.version} dari portal publik`,
    });
    revalidatePath("/backoffice/dataset");
    revalidatePath("/data");
    return { ok: true, message: "Dataset ditarik dari portal publik." };
  } catch {
    return { ok: false, error: "Gagal menarik dataset." };
  }
}

// ============ NOTIFIKASI ============

export async function kirimPengingat(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["ADMIN", "BAPPERIDA"]);
    const title = String(formData.get("title") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const opdIds = formData.getAll("opdIds").map(String);
    if (!title || !message || opdIds.length === 0) {
      return { ok: false, error: "Judul, pesan, dan minimal satu OPD tujuan wajib diisi." };
    }

    const notif = await db.notifikasi.create({
      data: { type: "PENGINGAT", title, message, opdId: opdIds.length === 1 ? opdIds[0] : null, createdBy: actor.id },
    });

    let recipients = 0;
    for (const opdId of opdIds) {
      const users = await db.user.findMany({ where: { opdId, role: "OPD", status: "AKTIF" } });
      for (const u of users) {
        await db.notifikasiPenerima.create({ data: { notifikasiId: notif.id, userId: u.id } });
        recipients++;
      }
    }

    await logActivity({ actor, action: "CREATE", entityType: "Notifikasi", entityId: notif.id, detail: `Mengirim pengingat "${title}" ke ${recipients} penerima` });
    revalidatePath("/backoffice/notifikasi");
    return { ok: true, message: `Pengingat terkirim ke ${recipients} penerima.` };
  } catch {
    return { ok: false, error: "Gagal mengirim pengingat." };
  }
}
