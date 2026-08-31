"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/audit";
import { requireInternal, hashPassword } from "@/lib/actions/helpers";

export type ActionResult = { ok: boolean; error?: string; message?: string };

// ============ PENGGUNA ============

export async function createPengguna(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["ADMIN"]);
    const nama = String(formData.get("nama") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "OPD");
    const opdId = String(formData.get("opdId") ?? "") || null;

    if (!nama || !email || password.length < 6) {
      return { ok: false, error: "Nama, email valid, dan kata sandi minimal 6 karakter wajib diisi." };
    }
    if (role === "OPD" && !opdId) {
      return { ok: false, error: "Pengguna OPD wajib dikaitkan dengan OPD." };
    }
    const exists = await db.user.findUnique({ where: { email } });
    if (exists) return { ok: false, error: "Email sudah digunakan." };

    const user = await db.user.create({
      data: { nama, email, passwordHash: hashPassword(password), role, opdId },
    });
    await logActivity({
      actor,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      detail: `Membuat pengguna ${nama} (${role})`,
    });
    revalidatePath("/backoffice/admin/pengguna");
    return { ok: true, message: `Pengguna ${nama} berhasil dibuat.` };
  } catch {
    return { ok: false, error: "Gagal membuat pengguna." };
  }
}

export async function updatePenggunaStatus(userId: string): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["ADMIN"]);
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { ok: false, error: "Pengguna tidak ditemukan." };
    if (user.id === actor.id) return { ok: false, error: "Tidak dapat menonaktifkan akun sendiri." };

    const newStatus = user.status === "AKTIF" ? "NONAKTIF" : "AKTIF";
    await db.user.update({ where: { id: userId }, data: { status: newStatus } });
    await logActivity({
      actor,
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      detail: `Mengubah status ${user.nama} menjadi ${newStatus}`,
    });
    revalidatePath("/backoffice/admin/pengguna");
    return { ok: true, message: `Status ${user.nama} diubah menjadi ${newStatus}.` };
  } catch {
    return { ok: false, error: "Gagal mengubah status." };
  }
}

export async function resetPasswordPengguna(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["ADMIN"]);
    const userId = String(formData.get("userId") ?? "");
    const password = String(formData.get("password") ?? "");
    if (password.length < 6) return { ok: false, error: "Kata sandi minimal 6 karakter." };

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { ok: false, error: "Pengguna tidak ditemukan." };

    await db.user.update({ where: { id: userId }, data: { passwordHash: hashPassword(password) } });
    await logActivity({
      actor,
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      detail: `Reset kata sandi ${user.nama}`,
    });
    revalidatePath("/backoffice/admin/pengguna");
    return { ok: true, message: `Kata sandi ${user.nama} berhasil direset.` };
  } catch {
    return { ok: false, error: "Gagal mereset kata sandi." };
  }
}

// ============ MASTER OPD ============

export async function createOpd(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["ADMIN", "BAPPERIDA"]);
    const nama = String(formData.get("nama") ?? "").trim();
    const kode = String(formData.get("kode") ?? "").trim();
    const singkatan = String(formData.get("singkatan") ?? "").trim();
    const slug =
      String(formData.get("slug") ?? "").trim() ||
      nama.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    if (!nama || !kode || !singkatan) return { ok: false, error: "Nama, kode, dan singkatan wajib diisi." };

    const exists = await db.opd.findUnique({ where: { slug } });
    if (exists) return { ok: false, error: "Slug sudah digunakan." };

    const count = await db.opd.count();
    const opd = await db.opd.create({
      data: { nama, kode, singkatan, slug, sortOrder: count + 1 },
    });
    await db.opdProfile.create({ data: { opdId: opd.id } });
    await logActivity({ actor, action: "CREATE", entityType: "Opd", entityId: opd.id, detail: `Mendaftarkan OPD ${nama}` });
    revalidatePath("/backoffice/admin/master");
    return { ok: true, message: `OPD ${nama} berhasil didaftarkan.` };
  } catch {
    return { ok: false, error: "Gagal mendaftarkan OPD (kode mungkin sudah ada)." };
  }
}

export async function updateOpdStatus(opdId: string): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["ADMIN", "BAPPERIDA"]);
    const opd = await db.opd.findUnique({ where: { id: opdId } });
    if (!opd) return { ok: false, error: "OPD tidak ditemukan." };
    // Nonaktif tidak menghapus data historis (soft-disable)
    const newStatus = opd.status === "AKTIF" ? "NONAKTIF" : "AKTIF";
    await db.opd.update({ where: { id: opdId }, data: { status: newStatus } });
    await logActivity({ actor, action: "UPDATE", entityType: "Opd", entityId: opdId, detail: `Status OPD ${opd.nama} → ${newStatus}` });
    revalidatePath("/backoffice/admin/master");
    return { ok: true, message: `Status OPD ${opd.nama} → ${newStatus}. Data historis tetap tersimpan.` };
  } catch {
    return { ok: false, error: "Gagal mengubah status OPD." };
  }
}

// ============ MASTER INDIKATOR ============

export async function createIndikator(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["ADMIN", "BAPPERIDA"]);
    const kode = String(formData.get("kode") ?? "").trim();
    const nama = String(formData.get("nama") ?? "").trim();
    const deskripsi = String(formData.get("deskripsi") ?? "").trim();
    const satuan = String(formData.get("satuan") ?? "").trim();
    if (!kode || !nama) return { ok: false, error: "Kode dan nama indikator wajib diisi." };

    const exists = await db.indikator.findUnique({ where: { kode } });
    if (exists) return { ok: false, error: "Kode indikator sudah digunakan." };

    const count = await db.indikator.count();
    const ind = await db.indikator.create({
      data: { kode, nama, deskripsi: deskripsi || null, satuanDefault: satuan || null, sortOrder: count + 1 },
    });
    await db.konfigurasiVisualisasi.create({ data: { indikatorId: ind.id } });
    await logActivity({ actor, action: "CREATE", entityType: "Indikator", entityId: ind.id, detail: `Membuat indikator ${nama}` });
    revalidatePath("/backoffice/admin/master");
    return { ok: true, message: `Indikator ${nama} berhasil dibuat.` };
  } catch {
    return { ok: false, error: "Gagal membuat indikator." };
  }
}

export async function toggleIndikator(indikatorId: string): Promise<ActionResult> {
  try {
    const actor = await requireInternal(["ADMIN", "BAPPERIDA"]);
    const ind = await db.indikator.findUnique({ where: { id: indikatorId } });
    if (!ind) return { ok: false, error: "Indikator tidak ditemukan." };
    await db.indikator.update({ where: { id: indikatorId }, data: { isActive: !ind.isActive } });
    await logActivity({
      actor,
      action: "UPDATE",
      entityType: "Indikator",
      entityId: indikatorId,
      detail: `${ind.isActive ? "Menonaktifkan" : "Mengaktifkan"} indikator ${ind.nama}`,
    });
    revalidatePath("/backoffice/admin/master");
    return { ok: true, message: `Indikator ${ind.nama} ${ind.isActive ? "dinonaktifkan" : "diaktifkan"}.` };
  } catch {
    return { ok: false, error: "Gagal mengubah indikator." };
  }
}
