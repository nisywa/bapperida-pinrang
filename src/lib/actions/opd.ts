"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/audit";
import { requireInternal, recomputeProgres, hashPassword } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/admin";

// ============ PENGISIAN DATA (draft & submit) ============

/** Ambil atau buat draft jawaban untuk penugasan. OPD hanya boleh milik OPD sendiri. */
async function getOrCreateJawaban(penugasanId: string, session: { id: string; opdId?: string | null }) {
  const penugasan = await db.penugasanOpd.findUnique({
    where: { id: penugasanId },
    include: { periode: true },
  });
  if (!penugasan) throw new Error("NOT_FOUND");
  // Scope check: OPD hanya boleh akses penugasan miliknya
  if (penugasan.opdId !== session.opdId) throw new Error("SCOPE_VIOLATION");
  if (penugasan.periode.status !== "AKTIF") throw new Error("PERIODE_DITUTUP");

  let jawaban = await db.jawabanOpd.findFirst({
    where: { penugasanId },
    orderBy: { version: "desc" },
  });
  if (!jawaban) {
    jawaban = await db.jawabanOpd.create({
      data: { penugasanId, version: 1, status: "DRAFT" },
    });
    await db.riwayatStatusJawaban.create({
      data: { jawabanId: jawaban.id, statusFrom: null, statusTo: "DRAFT", changedBy: session.id, reason: "Memulai pengisian" },
    });
  }
  return jawaban;
}

export async function simpanDetailJawaban(payload: {
  penugasanId: string;
  values: Array<{ pertanyaanId: string; wilayahId?: string | null; valueText?: string | null; valueNumber?: number | null; valueBoolean?: boolean | null; valueDate?: string | null }>;
}): Promise<ActionResult> {
  try {
    const session = await requireInternal(["OPD"]);
    const jawaban = await getOrCreateJawaban(payload.penugasanId, session);
    if (jawaban.status === "DIKIRIM") {
      return { ok: false, error: "Data sudah dikirim dan terkunci. Menunggu verifikasi Bapperida." };
    }

    for (const v of payload.values) {
      // scope check pertanyaan: harus termasuk target penugasan
      const target = await db.penugasanPertanyaan.findUnique({
        where: { penugasanId_pertanyaanId: { penugasanId: payload.penugasanId, pertanyaanId: v.pertanyaanId } },
      });
      if (!target) continue;

      // upsert per (jawaban, pertanyaan, wilayah)
      const existing = await db.detailJawaban.findFirst({
        where: {
          jawabanId: jawaban.id,
          pertanyaanId: v.pertanyaanId,
          wilayahId: v.wilayahId ?? null,
        },
      });
      const data = {
        valueText: v.valueText ?? null,
        valueNumber: v.valueNumber ?? null,
        valueBoolean: v.valueBoolean ?? null,
        valueDate: v.valueDate ? new Date(v.valueDate) : null,
      };
      const hasValue = Object.values(data).some((x) => x !== null);
      if (existing) {
        await db.detailJawaban.update({ where: { id: existing.id }, data });
      } else if (hasValue) {
        await db.detailJawaban.create({
          data: {
            jawabanId: jawaban.id,
            pertanyaanId: v.pertanyaanId,
            wilayahId: v.wilayahId ?? null,
            ...data,
          },
        });
      }
    }

    await recomputeProgres(payload.penugasanId);
    revalidatePath(`/backoffice/pengisian/${payload.penugasanId}`);
    revalidatePath("/backoffice/pengisian");
    revalidatePath("/backoffice");
    return { ok: true, message: "Draft tersimpan." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "SCOPE_VIOLATION") return { ok: false, error: "Akses ditolak: penugasan bukan milik OPD Anda." };
    if (msg === "PERIODE_DITUTUP") return { ok: false, error: "Periode pengisian sudah ditutup." };
    return { ok: false, error: "Gagal menyimpan draft." };
  }
}

export async function kirimJawaban(penugasanId: string): Promise<ActionResult> {
  try {
    const session = await requireInternal(["OPD"]);
    const jawaban = await getOrCreateJawaban(penugasanId, session);
    if (jawaban.status === "DIKIRIM") {
      return { ok: false, error: "Data sudah dikirim dan menunggu verifikasi." };
    }
    if (jawaban.status === "TERVERIFIKASI") {
      return { ok: false, error: "Data sudah terverifikasi." };
    }

    // Validasi: seluruh pertanyaan wajib harus terisi
    const targets = await db.penugasanPertanyaan.findMany({
      where: { penugasanId, required: true },
      include: { pertanyaan: true },
    });
    const details = await db.detailJawaban.findMany({ where: { jawabanId: jawaban.id } });
    const wilayahCount = await db.wilayah.count({ where: { isActive: true } });
    const missing: string[] = [];
    for (const t of targets) {
      const needed = t.pertanyaan.dimensiWilayah ? wilayahCount : 1;
      const filled = details.filter((d) => d.pertanyaanId === t.pertanyaanId).length;
      if (filled < needed) missing.push(t.pertanyaan.pertanyaan);
    }
    if (missing.length > 0) {
      return {
        ok: false,
        error: `Tidak dapat mengirim: ${missing.length} pertanyaan wajib belum lengkap. Contoh: ${missing.slice(0, 3).join("; ")}${missing.length > 3 ? "…" : ""}`,
      };
    }

    const wasRevision = jawaban.status === "PERLU_PERBAIKAN";
    const newVersion = wasRevision ? jawaban.version + 1 : jawaban.version;

    await db.jawabanOpd.update({
      where: { id: jawaban.id },
      data: { status: "DIKIRIM", submittedAt: new Date(), lockedAt: new Date(), version: newVersion },
    });
    await db.riwayatStatusJawaban.create({
      data: {
        jawabanId: jawaban.id,
        statusFrom: jawaban.status,
        statusTo: "DIKIRIM",
        changedBy: session.id,
        reason: wasRevision ? "Pengiriman ulang setelah perbaikan" : "Pengiriman data oleh OPD",
      },
    });

    // Notifikasi ke Bapperida
    const bapperidaUsers = await db.user.findMany({ where: { role: "BAPPERIDA" } });
    if (bapperidaUsers.length > 0) {
      const penugasan = await db.penugasanOpd.findUnique({
        where: { id: penugasanId },
        include: { indikator: true, opd: true },
      });
      if (penugasan) {
        const notif = await db.notifikasi.create({
          data: {
            type: "SISTEM",
            title: `Data Baru Menunggu Verifikasi`,
            message: `${penugasan.opd.nama} telah mengirim data untuk indikator ${penugasan.indikator.nama}.`,
            opdId: penugasan.opdId,
            penugasanId,
            createdBy: session.id,
          },
        });
        for (const u of bapperidaUsers) {
          await db.notifikasiPenerima.create({ data: { notifikasiId: notif.id, userId: u.id } });
        }
      }
    }

    await recomputeProgres(penugasanId);
    await logActivity({
      actor: session,
      action: "SUBMIT",
      entityType: "JawabanOpd",
      entityId: jawaban.id,
      detail: `Mengirim data penugasan (v${newVersion})`,
    });
    revalidatePath(`/backoffice/pengisian/${penugasanId}`);
    revalidatePath("/backoffice/pengisian");
    revalidatePath("/backoffice");
    revalidatePath("/backoffice/verifikasi");
    return { ok: true, message: "Data berhasil dikirim dan menunggu verifikasi Bapperida." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "SCOPE_VIOLATION") return { ok: false, error: "Akses ditolak." };
    return { ok: false, error: "Gagal mengirim data." };
  }
}

// ============ KONTEN OPD ============

export async function simpanArtikel(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireInternal(["OPD", "ADMIN", "BAPPERIDA"]);
    const id = String(formData.get("id") ?? "");
    const judul = String(formData.get("judul") ?? "").trim();
    const ringkasan = String(formData.get("ringkasan") ?? "").trim();
    const isi = String(formData.get("isi") ?? "").trim();
    const emoji = String(formData.get("emoji") ?? "📰").trim() || "📰";
    if (!judul || !ringkasan || !isi) return { ok: false, error: "Judul, ringkasan, dan isi wajib diisi." };

    // OPD hanya boleh artikel miliknya; Bapperida artikel portal (opdId null)
    const opdId = session.role === "OPD" ? session.opdId! : null;
    const slugBase = judul.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

    if (id) {
      const existing = await db.artikel.findUnique({ where: { id } });
      if (!existing) return { ok: false, error: "Artikel tidak ditemukan." };
      if (session.role === "OPD" && existing.opdId !== session.opdId) {
        return { ok: false, error: "Akses ditolak: artikel bukan milik OPD Anda." };
      }
      await db.artikel.update({
        where: { id },
        data: { judul, ringkasan, isi, thumbnailEmoji: emoji },
      });
      await logActivity({ actor: session, action: "UPDATE", entityType: "Artikel", entityId: id, detail: `Mengubah artikel "${judul}"` });
      revalidatePath("/backoffice/opd-konten");
      revalidatePath("/backoffice/konten");
      return { ok: true, message: "Artikel berhasil diperbarui." };
    }

    let slug = slugBase;
    let n = 1;
    while (await db.artikel.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${++n}`;
    }
    const artikel = await db.artikel.create({
      data: { opdId, judul, slug, ringkasan, isi, thumbnailEmoji: emoji, status: "DRAFT", createdBy: session.id },
    });
    await logActivity({ actor: session, action: "CREATE", entityType: "Artikel", entityId: artikel.id, detail: `Membuat draft artikel "${judul}"` });
    revalidatePath("/backoffice/opd-konten");
    revalidatePath("/backoffice/konten");
    return { ok: true, message: `Draft artikel "${judul}" berhasil dibuat.` };
  } catch {
    return { ok: false, error: "Gagal menyimpan artikel." };
  }
}

export async function publikasikanArtikel(id: string): Promise<ActionResult> {
  try {
    const session = await requireInternal(["OPD", "ADMIN", "BAPPERIDA"]);
    const artikel = await db.artikel.findUnique({ where: { id } });
    if (!artikel) return { ok: false, error: "Artikel tidak ditemukan." };
    if (session.role === "OPD" && artikel.opdId !== session.opdId) {
      return { ok: false, error: "Akses ditolak." };
    }
    const publish = artikel.status !== "PUBLISHED";
    await db.artikel.update({
      where: { id },
      data: {
        status: publish ? "PUBLISHED" : "DRAFT",
        publishedAt: publish ? new Date() : null,
        // Artikel OPD tampil di portal utama hanya jika showOnMainPortal; Bapperida default tampil
        showOnMainPortal: session.role === "OPD" ? artikel.showOnMainPortal : true,
      },
    });
    await logActivity({
      actor: session,
      action: publish ? "PUBLISH" : "UNPUBLISH",
      entityType: "Artikel",
      entityId: id,
      detail: `${publish ? "Mempublikasikan" : "Menarik"} artikel "${artikel.judul}"`,
    });
    revalidatePath("/backoffice/opd-konten");
    revalidatePath("/backoffice/konten");
    revalidatePath("/berita");
    return { ok: true, message: publish ? "Artikel dipublikasikan." : "Artikel dikembalikan ke draft." };
  } catch {
    return { ok: false, error: "Gagal mengubah status artikel." };
  }
}

export async function hapusArtikel(id: string): Promise<ActionResult> {
  try {
    const session = await requireInternal(["OPD", "ADMIN", "BAPPERIDA"]);
    const artikel = await db.artikel.findUnique({ where: { id } });
    if (!artikel) return { ok: false, error: "Artikel tidak ditemukan." };
    if (session.role === "OPD" && artikel.opdId !== session.opdId) {
      return { ok: false, error: "Akses ditolak." };
    }
    await db.artikelKategori.deleteMany({ where: { artikelId: id } });
    await db.artikel.delete({ where: { id } });
    await logActivity({ actor: session, action: "DELETE", entityType: "Artikel", entityId: id, detail: `Menghapus artikel "${artikel.judul}"` });
    revalidatePath("/backoffice/opd-konten");
    revalidatePath("/backoffice/konten");
    return { ok: true, message: "Artikel dihapus." };
  } catch {
    return { ok: false, error: "Gagal menghapus artikel." };
  }
}

export async function simpanPublikasi(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireInternal(["OPD", "ADMIN", "BAPPERIDA"]);
    const judul = String(formData.get("judul") ?? "").trim();
    const deskripsi = String(formData.get("deskripsi") ?? "").trim();
    const jenisFile = String(formData.get("jenisFile") ?? "PDF");
    const tahun = String(formData.get("tahun") ?? "").trim();
    if (!judul || !deskripsi) return { ok: false, error: "Judul dan deskripsi wajib diisi." };

    const opdId = session.role === "OPD" ? session.opdId! : null;
    const slugBase = judul.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
    let slug = slugBase;
    let n = 1;
    while (await db.publikasi.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${++n}`;
    }

    const pub = await db.publikasi.create({
      data: {
        opdId,
        judul,
        slug,
        deskripsi,
        jenisFile,
        tahun: tahun ? parseInt(tahun) : null,
        status: "DRAFT",
        createdBy: session.id,
      },
    });
    await logActivity({ actor: session, action: "CREATE", entityType: "Publikasi", entityId: pub.id, detail: `Membuat draft publikasi "${judul}"` });
    revalidatePath("/backoffice/opd-konten");
    revalidatePath("/backoffice/konten");
    return { ok: true, message: `Draft publikasi "${judul}" berhasil dibuat.` };
  } catch {
    return { ok: false, error: "Gagal menyimpan publikasi." };
  }
}

export async function publikasikanPublikasi(id: string): Promise<ActionResult> {
  try {
    const session = await requireInternal(["OPD", "ADMIN", "BAPPERIDA"]);
    const pub = await db.publikasi.findUnique({ where: { id } });
    if (!pub) return { ok: false, error: "Publikasi tidak ditemukan." };
    if (session.role === "OPD" && pub.opdId !== session.opdId) {
      return { ok: false, error: "Akses ditolak." };
    }
    const publish = pub.status !== "PUBLISHED";
    await db.publikasi.update({
      where: { id },
      data: { status: publish ? "PUBLISHED" : "DRAFT", publishedAt: publish ? new Date() : null },
    });
    await logActivity({
      actor: session,
      action: publish ? "PUBLISH" : "UNPUBLISH",
      entityType: "Publikasi",
      entityId: id,
      detail: `${publish ? "Mempublikasikan" : "Menarik"} publikasi "${pub.judul}"`,
    });
    revalidatePath("/backoffice/opd-konten");
    revalidatePath("/backoffice/konten");
    revalidatePath("/publikasi");
    return { ok: true, message: publish ? "Publikasi terbit dan dapat diunduh masyarakat." : "Publikasi dikembalikan ke draft." };
  } catch {
    return { ok: false, error: "Gagal mengubah status publikasi." };
  }
}

export async function hapusPublikasi(id: string): Promise<ActionResult> {
  try {
    const session = await requireInternal(["OPD", "ADMIN", "BAPPERIDA"]);
    const pub = await db.publikasi.findUnique({ where: { id } });
    if (!pub) return { ok: false, error: "Publikasi tidak ditemukan." };
    if (session.role === "OPD" && pub.opdId !== session.opdId) {
      return { ok: false, error: "Akses ditolak." };
    }
    await db.publikasi.delete({ where: { id } });
    await logActivity({ actor: session, action: "DELETE", entityType: "Publikasi", entityId: id, detail: `Menghapus publikasi "${pub.judul}"` });
    revalidatePath("/backoffice/opd-konten");
    revalidatePath("/backoffice/konten");
    return { ok: true, message: "Publikasi dihapus." };
  } catch {
    return { ok: false, error: "Gagal menghapus publikasi." };
  }
}

// ============ PROFIL & AKUN OPD ============

export async function simpanProfilOpd(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireInternal(["OPD", "ADMIN", "BAPPERIDA"]);
    let opdId: string;
    if (session.role === "OPD") {
      opdId = session.opdId!;
    } else {
      opdId = String(formData.get("opdId") ?? "");
    }
    if (!opdId) return { ok: false, error: "OPD tidak valid." };

    await db.opdProfile.upsert({
      where: { opdId },
      create: {
        opdId,
        deskripsi: String(formData.get("deskripsi") ?? ""),
        visi: String(formData.get("visi") ?? ""),
        misi: JSON.stringify(String(formData.get("misi") ?? "").split("\n").filter(Boolean)),
        alamat: String(formData.get("alamat") ?? ""),
        telepon: String(formData.get("telepon") ?? ""),
        emailPublic: String(formData.get("emailPublic") ?? ""),
        heroRingkasan: String(formData.get("heroRingkasan") ?? ""),
        logoEmoji: String(formData.get("logoEmoji") ?? "🏛️") || "🏛️",
      },
      update: {
        deskripsi: String(formData.get("deskripsi") ?? ""),
        visi: String(formData.get("visi") ?? ""),
        misi: JSON.stringify(String(formData.get("misi") ?? "").split("\n").filter(Boolean)),
        alamat: String(formData.get("alamat") ?? ""),
        telepon: String(formData.get("telepon") ?? ""),
        emailPublic: String(formData.get("emailPublic") ?? ""),
        heroRingkasan: String(formData.get("heroRingkasan") ?? ""),
        logoEmoji: String(formData.get("logoEmoji") ?? "🏛️") || "🏛️",
      },
    });
    await logActivity({ actor: session, action: "UPDATE", entityType: "OpdProfile", entityId: opdId, detail: "Memperbarui profil OPD" });
    revalidatePath("/backoffice/opd-profil");
    return { ok: true, message: "Profil OPD berhasil diperbarui." };
  } catch {
    return { ok: false, error: "Gagal menyimpan profil." };
  }
}

export async function ubahAkunSaya(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireInternal(["OPD", "ADMIN", "BAPPERIDA"]);
    const nama = String(formData.get("nama") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!nama) return { ok: false, error: "Nama wajib diisi." };
    if (password && password.length < 6) return { ok: false, error: "Kata sandi baru minimal 6 karakter." };

    await db.user.update({
      where: { id: session.id },
      data: { nama, ...(password ? { passwordHash: hashPassword(password) } : {}) },
    });
    await logActivity({ actor: session, action: "UPDATE", entityType: "User", entityId: session.id, detail: "Memperbarui akun sendiri" });
    revalidatePath("/backoffice/opd-akun");
    return { ok: true, message: "Akun berhasil diperbarui." };
  } catch {
    return { ok: false, error: "Gagal memperbarui akun." };
  }
}
