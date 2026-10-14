"use server";

import { revalidatePath, updateTag } from "next/cache";
import { PUBLIC_DATA_TAG } from "@/lib/public-db";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/audit";
import { requireInternal, recomputeProgres, hashPassword } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/admin";
import { saveArticleImage } from "@/lib/article-images";
import { encodeOpdLogo } from "@/lib/opd-logo";
import { Prisma } from "@prisma/client";
import { fillingError, hasAnswer as detailHasValue, normalizeAnswer } from "@/lib/questionnaire";

// ============ PENGISIAN DATA (draft & submit) ============

/** Ambil atau buat draft jawaban untuk penugasan. OPD hanya boleh milik OPD sendiri. */
async function getOrCreateJawaban(penugasanId: string, session: { id: string; opdId?: string | null }, client: Prisma.TransactionClient = db) {
  const penugasan = await client.penugasanOpd.findUnique({
    where: { id: penugasanId },
    include: { periode: true },
  });
  if (!penugasan) throw new Error("NOT_FOUND");
  // Scope check: OPD hanya boleh akses penugasan miliknya
  if (penugasan.opdId !== session.opdId) throw new Error("SCOPE_VIOLATION");
  const unavailable = fillingError(penugasan);
  if (unavailable) throw new Error(unavailable);

  let jawaban = await client.jawabanOpd.findFirst({
    where: { penugasanId },
    orderBy: { version: "desc" },
  });
  if (!jawaban) {
    jawaban = await client.jawabanOpd.create({
      data: { penugasanId, version: 1, status: "DRAFT" },
    });
    await client.riwayatStatusJawaban.create({
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
    if (["DIKIRIM", "TERVERIFIKASI"].includes(jawaban.status)) {
      return {
        ok: false,
        error:
          jawaban.status === "TERVERIFIKASI"
            ? "Data sudah terverifikasi dan tidak dapat diubah."
            : "Data sudah dikirim dan terkunci. Menunggu verifikasi Bapperida.",
      };
    }

    if (!Array.isArray(payload.values) || payload.values.length > 10000) return { ok: false, error: "Data jawaban tidak valid atau terlalu banyak." };
    await db.$transaction(async tx => {
    const assignment = await tx.penugasanOpd.findUnique({ where: { id: payload.penugasanId }, include: { periode: true } });
    if (!assignment || assignment.opdId !== session.opdId) throw new Error("SCOPE_VIOLATION");
    const unavailable = fillingError(assignment);
    if (unavailable) throw new Error(unavailable);
    const current = await tx.jawabanOpd.findUnique({ where: { id: jawaban.id } });
    if (!current || !["DRAFT", "PERLU_PERBAIKAN"].includes(current.status)) throw new Error("Jawaban sudah terkunci.");
    const cells = new Set<string>();
    for (const v of payload.values) {
      const cellKey = `${v.pertanyaanId}:${v.wilayahId ?? "-"}`;
      if (cells.has(cellKey)) throw new Error("Jawaban pertanyaan yang sama tidak boleh dikirim dua kali.");
      cells.add(cellKey);
      // scope check pertanyaan: harus termasuk target penugasan
      const target = await tx.penugasanPertanyaan.findUnique({
        where: { penugasanId_pertanyaanId: { penugasanId: payload.penugasanId, pertanyaanId: v.pertanyaanId } },
        include: { pertanyaan: { include: { opsi: true } } },
      });
      if (!target || !target.pertanyaan.isActive) throw new Error("Pertanyaan tidak aktif atau bukan bagian dari penugasan ini. Muat ulang formulir.");

      if (target.pertanyaan.dimensiWilayah) {
        if (!v.wilayahId) throw new Error("Kecamatan wajib dipilih untuk pertanyaan ini.");
        const wilayah = await tx.wilayah.findFirst({ where: { id: v.wilayahId, isActive: true } });
        if (!wilayah) throw new Error("Kecamatan tidak valid.");
      } else if (v.wilayahId) {
        throw new Error("Pertanyaan ini tidak menggunakan dimensi kecamatan.");
      }
      if (target.pertanyaan.tipeJawaban === "FILE" && v.valueText) {
        const uploaded = await tx.uploadedFile.findFirst({
          where: { id: v.valueText, opdId: session.opdId ?? undefined },
        });
        if (!uploaded) throw new Error("Dokumen pendukung tidak ditemukan atau bukan milik OPD Anda.");
      }

      // upsert per (jawaban, pertanyaan, wilayah)
      const existing = await tx.detailJawaban.findFirst({
        where: {
          jawabanId: jawaban.id,
          pertanyaanId: v.pertanyaanId,
          wilayahId: v.wilayahId ?? null,
        },
      });
      const data = normalizeAnswer(target.pertanyaan, v);
      const hasValue = detailHasValue(data);
      if (existing && !hasValue) {
        await tx.detailJawaban.delete({ where: { id: existing.id } });
      } else if (existing) {
        await tx.detailJawaban.update({ where: { id: existing.id }, data });
      } else if (hasValue) {
        await tx.detailJawaban.create({
          data: {
            jawabanId: jawaban.id,
            pertanyaanId: v.pertanyaanId,
            wilayahId: v.wilayahId ?? null,
            ...data,
          },
        });
      }
    }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });

    await recomputeProgres(payload.penugasanId);
    revalidatePath(`/backoffice/pengisian/${payload.penugasanId}`);
    revalidatePath("/backoffice/pengisian");
    revalidatePath("/backoffice");
    return { ok: true, message: "Draft tersimpan." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "SCOPE_VIOLATION") return { ok: false, error: "Akses ditolak: penugasan bukan milik OPD Anda." };
    if (e instanceof Prisma.PrismaClientKnownRequestError) return { ok: false, error: "Data berubah saat disimpan. Muat ulang formulir dan coba lagi." };
    return { ok: false, error: msg === "UNAUTHORIZED" ? "Akses ditolak." : msg || "Gagal menyimpan draft." };
  }
}

export async function kirimJawaban(penugasanId: string): Promise<ActionResult> {
  try {
    const session = await requireInternal(["OPD"]);
    const { jawaban, newVersion } = await db.$transaction(async tx => {
    const jawaban = await getOrCreateJawaban(penugasanId, session, tx);
    if (jawaban.status === "DIKIRIM") {
      throw new Error("Data sudah dikirim dan menunggu verifikasi.");
    }
    if (jawaban.status === "TERVERIFIKASI") {
      throw new Error("Data sudah terverifikasi.");
    }

    // Validasi: seluruh pertanyaan wajib harus terisi
    const allTargets = await tx.penugasanPertanyaan.findMany({
      where: { penugasanId, pertanyaan: { isActive: true } },
      include: { pertanyaan: { include: { opsi: true } } },
    });
    if (!allTargets.length) throw new Error("Penugasan belum memiliki pertanyaan aktif. Hubungi Bapperida.");
    const targets = allTargets.filter(t => t.required);
    const details = (await tx.detailJawaban.findMany({ where: { jawabanId: jawaban.id } })).filter(detailHasValue);
    const wilayahIds = (await tx.wilayah.findMany({ where: { isActive: true }, select: { id: true } })).map((w) => w.id);
    const missing: string[] = [];
    for (const t of targets) {
      const questionDetails = details.filter((d) => d.pertanyaanId === t.pertanyaanId && detailHasValue(normalizeAnswer(t.pertanyaan, { ...d, valueDate: d.valueDate?.toISOString().slice(0, 10) })));
      const complete = t.pertanyaan.dimensiWilayah
        ? wilayahIds.every((wilayahId) => questionDetails.some((d) => d.wilayahId === wilayahId))
        : questionDetails.some((d) => d.wilayahId === null);
      if (!complete) missing.push(t.pertanyaan.pertanyaan);
    }
    if (missing.length > 0) {
      throw new Error(`Tidak dapat mengirim: ${missing.length} pertanyaan wajib belum lengkap. Contoh: ${missing.slice(0, 3).join("; ")}${missing.length > 3 ? "…" : ""}`);
    }

    const wasRevision = jawaban.status === "PERLU_PERBAIKAN";
    const newVersion = wasRevision ? jawaban.version + 1 : jawaban.version;

    await tx.jawabanOpd.update({
      where: { id: jawaban.id },
      data: { status: "DIKIRIM", submittedAt: new Date(), lockedAt: new Date(), version: newVersion },
    });
    await tx.riwayatStatusJawaban.create({
      data: {
        jawabanId: jawaban.id,
        statusFrom: jawaban.status,
        statusTo: "DIKIRIM",
        changedBy: session.id,
        reason: wasRevision ? "Pengiriman ulang setelah perbaikan" : "Pengiriman data oleh OPD",
      },
    });

    return { jawaban, newVersion };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });

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
    return { ok: false, error: msg === "UNAUTHORIZED" ? "Akses ditolak." : msg || "Gagal mengirim data." };
  }
}

// ============ NOTIFIKASI PENGGUNA ============

export async function tandaiNotifikasiDibaca(penerimaId?: string): Promise<ActionResult> {
  try {
    const session = await requireInternal(["ADMIN", "BAPPERIDA", "OPD"]);
    if (penerimaId) {
      const recipient = await db.notifikasiPenerima.findFirst({
        where: { id: penerimaId, userId: session.id },
      });
      if (!recipient) return { ok: false, error: "Notifikasi tidak ditemukan." };
      if (!recipient.readAt) {
        await db.notifikasiPenerima.update({ where: { id: recipient.id }, data: { readAt: new Date() } });
      }
    } else {
      await db.notifikasiPenerima.updateMany({
        where: { userId: session.id, readAt: null },
        data: { readAt: new Date() },
      });
    }
    revalidatePath("/backoffice/notifikasi-saya");
    revalidatePath("/backoffice");
    return { ok: true, message: penerimaId ? "Notifikasi ditandai sudah dibaca." : "Semua notifikasi sudah dibaca." };
  } catch {
    return { ok: false, error: "Gagal memperbarui notifikasi." };
  }
}

// ============ KONTEN PORTAL — BAPPERIDA ============

export async function simpanArtikel(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireInternal(["BAPPERIDA"]);
    const id = String(formData.get("id") ?? "");
    const judul = String(formData.get("judul") ?? "").trim();
    const ringkasan = String(formData.get("ringkasan") ?? "").trim();
    const isi = String(formData.get("isi") ?? "").trim();
    const emoji = String(formData.get("emoji") ?? "📰").trim() || "📰";
    if (!judul || !ringkasan || !isi) return { ok: false, error: "Judul, ringkasan, dan isi wajib diisi." };

    // Artikel baru hanya dibuat Bapperida untuk portal utama.
    const opdId = null;
    const slugBase = judul.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

    if (id) {
      const existing = await db.artikel.findUnique({ where: { id } });
      if (!existing) return { ok: false, error: "Artikel tidak ditemukan." };
      let thumbnailUrl = existing.thumbnailUrl;
      const photo = formData.get("photo");
      if (photo instanceof File && photo.size > 0) {
        try { thumbnailUrl = await saveArticleImage(photo); }
        catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Gagal mengunggah foto." }; }
      }
      await db.artikel.update({
        where: { id },
        data: { judul, ringkasan, isi, thumbnailEmoji: emoji, thumbnailUrl },
      });
      await logActivity({ actor: session, action: "UPDATE", entityType: "Artikel", entityId: id, detail: `Mengubah artikel "${judul}"` });
      revalidatePath("/backoffice/konten");
      updateTag(PUBLIC_DATA_TAG);
      revalidatePath("/", "layout");
      return { ok: true, message: "Artikel berhasil diperbarui." };
    }

    let slug = slugBase;
    let n = 1;
    while (await db.artikel.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${++n}`;
    }
    let thumbnailUrl: string | null = null;
    const photo = formData.get("photo");
    if (photo instanceof File && photo.size > 0) {
      try { thumbnailUrl = await saveArticleImage(photo); }
      catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Gagal mengunggah foto." }; }
    }
    const artikel = await db.artikel.create({
      data: { opdId, judul, slug, ringkasan, isi, thumbnailEmoji: emoji, thumbnailUrl, showOnMainPortal: true, status: "DRAFT", createdBy: session.id },
    });
    await logActivity({ actor: session, action: "CREATE", entityType: "Artikel", entityId: artikel.id, detail: `Membuat draft artikel "${judul}"` });
    revalidatePath("/backoffice/konten");
    return { ok: true, message: `Draft artikel "${judul}" berhasil dibuat.` };
  } catch {
    return { ok: false, error: "Gagal menyimpan artikel." };
  }
}

export async function publikasikanArtikel(id: string): Promise<ActionResult> {
  try {
    const session = await requireInternal(["BAPPERIDA"]);
    const artikel = await db.artikel.findUnique({ where: { id } });
    if (!artikel) return { ok: false, error: "Artikel tidak ditemukan." };
    const publish = artikel.status !== "PUBLISHED";
    await db.artikel.update({
      where: { id },
      data: {
        status: publish ? "PUBLISHED" : "DRAFT",
        publishedAt: publish ? new Date() : null,
        // Bapperida controls publication on the main portal.
        showOnMainPortal: true,
      },
    });
    await logActivity({
      actor: session,
      action: publish ? "PUBLISH" : "UNPUBLISH",
      entityType: "Artikel",
      entityId: id,
      detail: `${publish ? "Mempublikasikan" : "Menarik"} artikel "${artikel.judul}"`,
    });
    revalidatePath("/backoffice/konten");
    updateTag(PUBLIC_DATA_TAG);
    revalidatePath("/", "layout");
    revalidatePath("/berita");
    return { ok: true, message: publish ? "Artikel dipublikasikan." : "Artikel dikembalikan ke draft." };
  } catch {
    return { ok: false, error: "Gagal mengubah status artikel." };
  }
}

export async function hapusArtikel(id: string): Promise<ActionResult> {
  try {
    const session = await requireInternal(["BAPPERIDA"]);
    const artikel = await db.artikel.findUnique({ where: { id } });
    if (!artikel) return { ok: false, error: "Artikel tidak ditemukan." };
    await db.artikelKategori.deleteMany({ where: { artikelId: id } });
    await db.artikel.delete({ where: { id } });
    await logActivity({ actor: session, action: "DELETE", entityType: "Artikel", entityId: id, detail: `Menghapus artikel "${artikel.judul}"` });
    revalidatePath("/backoffice/konten");
    updateTag(PUBLIC_DATA_TAG);
    revalidatePath("/", "layout");
    return { ok: true, message: "Artikel dihapus." };
  } catch {
    return { ok: false, error: "Gagal menghapus artikel." };
  }
}

export async function simpanPublikasi(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireInternal(["BAPPERIDA"]);
    const judul = String(formData.get("judul") ?? "").trim();
    const deskripsi = String(formData.get("deskripsi") ?? "").trim();
    const jenisFile = String(formData.get("jenisFile") ?? "PDF");
    const tahun = String(formData.get("tahun") ?? "").trim();
    if (!judul || !deskripsi) return { ok: false, error: "Judul dan deskripsi wajib diisi." };

    const opdId = null;
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
    revalidatePath("/backoffice/konten");
    return { ok: true, message: `Draft publikasi "${judul}" berhasil dibuat.` };
  } catch {
    return { ok: false, error: "Gagal menyimpan publikasi." };
  }
}

export async function publikasikanPublikasi(id: string): Promise<ActionResult> {
  try {
    const session = await requireInternal(["BAPPERIDA"]);
    const pub = await db.publikasi.findUnique({ where: { id } });
    if (!pub) return { ok: false, error: "Publikasi tidak ditemukan." };
    const publish = pub.status !== "PUBLISHED";
    await db.publikasi.update({
      where: { id },
      data: {
        status: publish ? "PUBLISHED" : "DRAFT",
        publishedAt: publish ? new Date() : null,
        ...(publish && session.role === "BAPPERIDA" && !pub.opdId ? { visibility: "PUBLIC" } : {}),
      },
    });
    await logActivity({
      actor: session,
      action: publish ? "PUBLISH" : "UNPUBLISH",
      entityType: "Publikasi",
      entityId: id,
      detail: `${publish ? "Mempublikasikan" : "Menarik"} publikasi "${pub.judul}"`,
    });
    revalidatePath("/backoffice/konten");
    updateTag(PUBLIC_DATA_TAG);
    revalidatePath("/", "layout");
    revalidatePath("/publikasi");
    return { ok: true, message: publish ? "Publikasi terbit dan dapat diunduh masyarakat." : "Publikasi dikembalikan ke draft." };
  } catch {
    return { ok: false, error: "Gagal mengubah status publikasi." };
  }
}

export async function hapusPublikasi(id: string): Promise<ActionResult> {
  try {
    const session = await requireInternal(["BAPPERIDA"]);
    const pub = await db.publikasi.findUnique({ where: { id } });
    if (!pub) return { ok: false, error: "Publikasi tidak ditemukan." };
    await db.publikasi.delete({ where: { id } });
    await logActivity({ actor: session, action: "DELETE", entityType: "Publikasi", entityId: id, detail: `Menghapus publikasi "${pub.judul}"` });
    revalidatePath("/backoffice/konten");
    updateTag(PUBLIC_DATA_TAG);
    revalidatePath("/", "layout");
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

    const logo = formData.get("logo");
    let logoUrl: string | null | undefined = formData.get("removeLogo") === "true" ? null : undefined;
    if (logo instanceof File && logo.size > 0) {
      try { logoUrl = await encodeOpdLogo(logo); }
      catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Gagal menyimpan logo." }; }
    }
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
        logoUrl: logoUrl ?? null,
      },
      update: {
        deskripsi: String(formData.get("deskripsi") ?? ""),
        visi: String(formData.get("visi") ?? ""),
        misi: JSON.stringify(String(formData.get("misi") ?? "").split("\n").filter(Boolean)),
        alamat: String(formData.get("alamat") ?? ""),
        telepon: String(formData.get("telepon") ?? ""),
        emailPublic: String(formData.get("emailPublic") ?? ""),
        heroRingkasan: String(formData.get("heroRingkasan") ?? ""),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
      },
    });
    await logActivity({ actor: session, action: "UPDATE", entityType: "OpdProfile", entityId: opdId, detail: "Memperbarui profil OPD" });
    updateTag(PUBLIC_DATA_TAG);
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
    if (password && password.length < 8) return { ok: false, error: "Kata sandi baru minimal 8 karakter." };

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
