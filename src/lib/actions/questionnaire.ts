"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { PUBLIC_DATA_TAG } from "@/lib/public-db";
import { requireInternal, recomputeProgres } from "@/lib/actions/helpers";
import { logActivity } from "@/lib/audit";
import { QUESTION_TYPES, CHOICE_TYPES, parseOptions } from "@/lib/questionnaire";
import type { ActionResult } from "@/lib/actions/admin";

function field(form: FormData, name: string, max = 2000) {
  const text = String(form.get(name) ?? "").trim();
  if (text.length > max) throw new Error(`Isian ${name} maksimal ${max} karakter.`);
  return text;
}
function errorResult(error: unknown): ActionResult {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return { ok: false, error: error.code === "P2002" ? "Kode sudah digunakan. Pilih kode lain." : "Data berubah saat disimpan. Muat ulang dan coba lagi." };
  }
  return { ok: false, error: error instanceof Error && error.message !== "UNAUTHORIZED" ? error.message : "Akses ditolak." };
}
function refresh() {
  for (const path of ["/backoffice/indikator", "/backoffice/admin/master", "/backoffice/penugasan", "/backoffice/pengisian", "/backoffice/monitoring", "/backoffice/verifikasi"]) revalidatePath(path, "layout");
  updateTag(PUBLIC_DATA_TAG);
}
async function refreshProgress(indikatorId: string) {
  const assignments = await db.penugasanOpd.findMany({ where: { indikatorId, periode: { status: "AKTIF" }, jawaban: { none: { status: { in: ["DIKIRIM", "TERVERIFIKASI"] } } } }, select: { id: true } });
  for (const assignment of assignments) await recomputeProgres(assignment.id);
}

export async function saveIndikator(form: FormData): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["BAPPERIDA", "ADMIN"]);
    const id = field(form, "id"), kode = field(form, "kode", 60), nama = field(form, "nama", 300);
    if (!kode || !nama) throw new Error("Kode dan nama indikator wajib diisi.");
    const data = { kode, nama, deskripsi: field(form, "deskripsi") || null, satuanDefault: field(form, "satuan", 100) || null, isActive: form.get("isActive") === "on" };
    const record = id
      ? await db.indikator.update({ where: { id }, data })
      : await db.indikator.create({ data: { ...data, sortOrder: await db.indikator.count(), visualisasi: { create: {} } } });
    await logActivity({ actor, action: id ? "UPDATE" : "CREATE", entityType: "Indikator", entityId: record.id, detail: `${id ? "Mengubah" : "Membuat"} indikator ${nama}` });
    refresh();
    return { ok: true, message: "Indikator disimpan." };
  } catch (error) { return errorResult(error); }
}

export async function saveAspek(form: FormData): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["BAPPERIDA", "ADMIN"]);
    const id = field(form, "id"), indikatorId = field(form, "indikatorId"), nama = field(form, "nama", 300);
    if (!nama || !indikatorId) throw new Error("Indikator dan nama aspek wajib diisi.");
    const record = await db.$transaction(async tx => {
      if (!await tx.indikator.findUnique({ where: { id: indikatorId } })) throw new Error("Indikator tidak ditemukan.");
      if (id) {
        const current = await tx.aspekIndikator.findUnique({ where: { id } });
        if (!current || current.indikatorId !== indikatorId) throw new Error("Aspek tidak sesuai indikator.");
        return tx.aspekIndikator.update({ where: { id }, data: { nama, deskripsi: field(form, "deskripsi") || null } });
      }
      return tx.aspekIndikator.create({ data: { indikatorId, nama, deskripsi: field(form, "deskripsi") || null, sortOrder: await tx.aspekIndikator.count({ where: { indikatorId } }) } });
    });
    await logActivity({ actor, action: id ? "UPDATE" : "CREATE", entityType: "AspekIndikator", entityId: record.id, detail: `Menyimpan aspek ${nama}` });
    refresh();
    return { ok: true, message: "Aspek disimpan." };
  } catch (error) { return errorResult(error); }
}

export async function savePertanyaan(form: FormData): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["BAPPERIDA", "ADMIN"]);
    const id = field(form, "id"), aspekId = field(form, "aspekId"), kode = field(form, "kode", 60), pertanyaan = field(form, "pertanyaan");
    const tipeJawaban = field(form, "tipeJawaban");
    if (!aspekId || !kode || !pertanyaan) throw new Error("Aspek, kode, dan pertanyaan wajib diisi.");
    // Legacy questions remain editable without forcing conversion of existing answers.
    const legacyTypes = ["DATE", "BOOLEAN", "OPTIONS", "FILE"];
    const current = id ? await db.pertanyaanIndikator.findUnique({ where: { id } }) : null;
    if (!Object.hasOwn(QUESTION_TYPES, tipeJawaban) && !(current?.tipeJawaban === tipeJawaban && legacyTypes.includes(tipeJawaban))) throw new Error("Pilih salah satu dari lima tipe jawaban.");
    const options = CHOICE_TYPES.includes(tipeJawaban) ? parseOptions(field(form, "opsi", 11000)) : [];
    const data = { kode, pertanyaan, tipeJawaban, wajibDefault: form.get("wajibDefault") === "on", dimensiWilayah: form.get("dimensiWilayah") === "on", satuan: field(form, "satuan", 100) || null, helpText: field(form, "helpText") || null };
    const result = await db.$transaction(async tx => {
      const aspect = await tx.aspekIndikator.findUnique({ where: { id: aspekId } });
      if (!aspect) throw new Error("Aspek tidak ditemukan.");
      const existing = id ? await tx.pertanyaanIndikator.findUnique({ where: { id }, include: { opsi: { orderBy: { sortOrder: "asc" } }, _count: { select: { detailJawaban: true } } } }) : null;
      if (id && (!existing || existing.aspekId !== aspekId || !existing.isActive)) throw new Error("Pertanyaan tidak ditemukan pada aspek ini.");
      const optionsChanged = existing && JSON.stringify(existing.opsi.map(o => o.label)) !== JSON.stringify(options);
      if (existing && existing._count.detailJawaban > 0 && (existing.tipeJawaban !== tipeJawaban || existing.dimensiWilayah !== data.dimensiWilayah || optionsChanged)) throw new Error("Tipe, pilihan, dan dimensi pertanyaan yang sudah dijawab tidak dapat diubah. Tambahkan pertanyaan baru untuk format berbeda.");
      let question;
      if (existing) {
        question = await tx.pertanyaanIndikator.update({ where: { id }, data });
        if (optionsChanged) {
          await tx.opsiPertanyaan.deleteMany({ where: { pertanyaanId: id } });
          if (options.length) await tx.opsiPertanyaan.createMany({ data: options.map((label, sortOrder) => ({ pertanyaanId: id, label, nilai: label, sortOrder })) });
        }
      } else {
        question = await tx.pertanyaanIndikator.create({ data: { ...data, aspekId, sortOrder: await tx.pertanyaanIndikator.count({ where: { aspekId } }), opsi: { create: options.map((label, sortOrder) => ({ label, nilai: label, sortOrder })) } } });
      }
      const assignments = await tx.penugasanOpd.findMany({ where: { indikatorId: aspect.indikatorId, status: "AKTIF", periode: { status: "AKTIF" }, jawaban: { none: { status: { in: ["DIKIRIM", "TERVERIFIKASI"] } } } }, select: { id: true } });
      for (const assignment of assignments) await tx.penugasanPertanyaan.upsert({ where: { penugasanId_pertanyaanId: { penugasanId: assignment.id, pertanyaanId: question.id } }, create: { penugasanId: assignment.id, pertanyaanId: question.id, required: data.wajibDefault }, update: { required: data.wajibDefault } });
      return { question, indikatorId: aspect.indikatorId };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 });
    await logActivity({ actor, action: id ? "UPDATE" : "CREATE", entityType: "PertanyaanIndikator", entityId: result.question.id, detail: `Menyimpan pertanyaan ${kode}` });
    await refreshProgress(result.indikatorId);
    refresh();
    return { ok: true, message: "Pertanyaan disimpan dan langsung tersedia pada daftar indikator." };
  } catch (error) { return errorResult(error); }
}

export async function deletePertanyaan(id: string): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["BAPPERIDA", "ADMIN"]);
    const question = await db.$transaction(async tx => {
      const record = await tx.pertanyaanIndikator.update({ where: { id }, data: { isActive: false }, include: { aspek: true } });
      // Submitted forms keep their original target list; drafts drop archived questions.
      await tx.penugasanPertanyaan.deleteMany({ where: { pertanyaanId: id, penugasan: { jawaban: { none: { status: { in: ["DIKIRIM", "TERVERIFIKASI"] } } } } } });
      return record;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    await logActivity({ actor, action: "DELETE", entityType: "PertanyaanIndikator", entityId: id, detail: `Menghapus pertanyaan ${question.kode} dari pengisian aktif; riwayat jawaban diarsipkan` });
    await refreshProgress(question.aspek.indikatorId);
    refresh();
    return { ok: true, message: "Pertanyaan dihapus dari formulir aktif. Riwayat jawaban tetap tersimpan." };
  } catch (error) { return errorResult(error); }
}

export async function deleteAspek(id: string): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["BAPPERIDA", "ADMIN"]);
    await db.$transaction(async tx => {
      const aspect = await tx.aspekIndikator.findUnique({ where: { id }, include: { pertanyaan: { include: { _count: { select: { detailJawaban: true } } } } } });
      if (!aspect) throw new Error("Aspek tidak ditemukan.");
      if (aspect.pertanyaan.some(q => q.isActive || q._count.detailJawaban > 0)) throw new Error("Aspek masih memiliki pertanyaan atau riwayat jawaban. Hapus pertanyaan aktif terlebih dahulu; aspek dengan riwayat tetap disimpan.");
      const ids = aspect.pertanyaan.map(q => q.id);
      await tx.penugasanPertanyaan.deleteMany({ where: { pertanyaanId: { in: ids } } });
      await tx.opsiPertanyaan.deleteMany({ where: { pertanyaanId: { in: ids } } });
      await tx.pertanyaanIndikator.deleteMany({ where: { aspekId: id } });
      await tx.aspekIndikator.delete({ where: { id } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    await logActivity({ actor, action: "DELETE", entityType: "AspekIndikator", entityId: id, detail: "Menghapus aspek kosong tanpa riwayat jawaban" });
    refresh();
    return { ok: true, message: "Aspek dihapus." };
  } catch (error) { return errorResult(error); }
}
