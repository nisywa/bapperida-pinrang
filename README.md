# Menjalankan aplikasi secara lokal

## Demo visualisasi dua indikator per OPD

Jalankan `npm run db:seed:opd-demo -- --year=2026` untuk menambahkan periode
`DEMO-OPD-2026`, dua penugasan indikator per OPD, dan jawaban bervariasi pada
seluruh kecamatan aktif. Script menambahkan data tanpa reset dan mempertahankan
jawaban yang sudah ada jika dijalankan ulang. Data demo tidak dipublikasikan.

Halaman login menyediakan pilihan **Demo visualisasi OPD · 2 indikator** untuk
delapan OPD. Akun menggunakan pola `demo.<slug-opd>@pinrang.go.id` dengan kata
sandi demo `DemoOpd#2026`, role `OPD`, dan cakupan dinas masing-masing. Akun
Admin, Bapperida, serta akun OPD lama tetap menggunakan pengaturan sebelumnya.
Pemetaan dinas dan indikator berada pada `src/data/opd-demo.json`.

Menu **Visualisasi Data** memiliki filter indikator, periode, dan metrik wilayah,
serta menampilkan peta, grafik peringkat kecamatan, jumlah, rata-rata, dan nilai
tertinggi. Untuk metrik persen, kartu pertama menampilkan jumlah kecamatan
terisi, bukan penjumlahan persentase. Periode demo diberi penanda data dummy.
Pilihan dan pengambilan jawaban sama-sama dibatasi oleh OPD pengguna di server.

Pengujian: `node scripts/test-opd-visualizations.cjs` dan
`node scripts/test-opd-visualizations.cjs --integration` setelah seeding.

## Pengelolaan indikator dan pengisian OPD

Bapperida mengelola struktur **Indikator → Aspek → Pertanyaan → Jawaban**
melalui menu **Indikator & Pertanyaan** (`/backoffice/indikator`). Indikator,
aspek, dan pertanyaan dapat ditambah dan diedit. Pertanyaan mendukung radio
button, checkbox, angka, teks, dan dropdown. Radio, checkbox, dan dropdown
memerlukan 2–50 pilihan, satu pilihan per baris. Pratinjau jawaban ditampilkan
di bawah setiap pertanyaan. Penghapusan pertanyaan mengarsipkannya dari
formulir aktif dan mempertahankan riwayat jawaban; aspek hanya dapat dihapus
jika kosong dan tidak memiliki riwayat jawaban. Indikator dapat dinonaktifkan.

Melalui **Penugasan Indikator**, Bapperida memilih indikator, satu atau beberapa
OPD aktif, dan periode pengisian. Pertanyaan wajib/opsional mengikuti pengaturan
pertanyaan. Rentang pengisian berlaku inklusif dalam WITA, mulai pukul 00.00
sampai 23.59 pada tanggal selesai; periode satu hari didukung. Tenggat opsional
harus berada dalam rentang periode. Bapperida dapat mengedit, menutup/membuka
kembali periode, serta mengubah tenggat dan menonaktifkan akses tiap penugasan.

Server memeriksa kepemilikan OPD, status akses, tanggal mulai/selesai, tenggat,
pertanyaan target, dan pilihan jawaban ketika menyimpan atau mengirim data.
Checkbox disimpan sebagai array JSON dalam kolom teks. Nilai kosong tidak
memenuhi pertanyaan wajib; angka nol merupakan jawaban yang valid. Draft
disimpan atomik dan jawaban yang sudah dikirim terkunci. Tipe, pilihan, dan
dimensi pertanyaan yang sudah memiliki jawaban tidak dapat diubah; buat
pertanyaan baru untuk format berbeda. Pertanyaan baru disinkronkan ke
penugasan aktif yang belum dikirim, sementara kiriman lama memakai targetnya.
Tipe pertanyaan lama tetap didukung tanpa migrasi database.

Pengujian aturan dan validasi: `node scripts/test-questionnaire.cjs`.
Pengujian alur dengan data sementara di database:
`node scripts/test-questionnaire.cjs --integration`.

Aplikasi menggunakan **PostgreSQL**, sesuai `prisma/schema.prisma`.
Koneksi aktif di `.env` menggunakan **Supabase**. URL database lokal lama
dipertahankan sebagai `LOCAL_DATABASE_URL` untuk ekspor/cadangan.
`DATABASE_URL` menggunakan pooler transaksi port 6543, sedangkan `DIRECT_URL`
menggunakan pooler sesi port 5432. Menyalakan Laragon tidak diperlukan
untuk koneksi Supabase.

Jalankan dari folder proyek:

```sh
npm run dev
```

Untuk koneksi Supabase, langkah `predev` melewati startup database lokal.
Jika `DATABASE_URL` diarahkan kembali ke `localhost:5433`, pada Windows
langkah `predev` menyalakan database yang sudah ada di
`.postgres-data` sebelum Next.js berjalan. Jika port 5433 sudah aktif,
langkah ini melewati proses startup. Tidak ada proses reset atau seed otomatis.
Database tetap berjalan setelah server pengembangan dihentikan.

Untuk menyalakan database saja:

```sh
npm run db:start
```

### Jika koneksi Supabase gagal saat pengembangan

Jika Supabase mengembalikan `tenant/user ... not found`, periksa hostname dan
nama pengguna pada **Supabase > Connect**. Port yang dapat dijangkau belum
berarti identitas proyek pada connection string sudah benar. Pastikan proyek
aktif dan gunakan connection string proyek tersebut; jangan menebak hostname
atau project reference.

Untuk menjalankan data lokal yang sudah ada, buat `.env.development.local`
dengan menyalin nilai `LOCAL_DATABASE_URL` yang tersimpan di `.env` ke kedua
variabel berikut:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5433/baperida_pinrang"
DIRECT_URL="postgresql://USER:PASSWORD@localhost:5433/baperida_pinrang"
```

File ini hanya berlaku pada mode pengembangan dan tidak masuk Git. Mulai ulang
server dengan `npm run dev` agar koneksi Prisma lama dilepas. Langkah `predev`
menyalakan PostgreSQL lokal tanpa reset atau seed. Deployment tetap menggunakan
konfigurasi Supabase, yang harus diperbaiki secara terpisah jika koneksinya gagal.
Hapus override ini dan mulai ulang server ketika ingin menguji Supabase kembali.

PostgreSQL dicari di `C:\Program Files\PostgreSQL\<versi>\bin`, dengan versi
sesuai `.postgres-data/PG_VERSION`. Jika instalasinya berada di lokasi lain,
tambahkan `PG_BIN` di `.env`, misalnya:

```dotenv
PG_BIN="D:/lokasi/PostgreSQL/13/bin"
```

Jika startup gagal, periksa `postgres.log` di folder proyek. Untuk komputer
baru tanpa `.postgres-data`, siapkan database PostgreSQL terlebih dahulu dan
atur `DATABASE_URL` di `.env`. Database pada port lain atau server jarak jauh
harus dijalankan melalui pengelola database masing-masing.

## Deploy ke Vercel

`localhost:5433` hanya untuk pengembangan di komputer lokal. Vercel harus
menggunakan database PostgreSQL online yang dapat diakses dari server Vercel.

1. Siapkan PostgreSQL online, misalnya Supabase atau Neon, dan salin connection
   string dari penyedia database. Gunakan koneksi pooler yang direkomendasikan
   penyedia untuk aplikasi serverless beserta parameter SSL yang diperlukan.
2. Di **Vercel > Settings > Environment Variables**, atur `DATABASE_URL` untuk
   **Production**. Untuk **Preview**, gunakan database terpisah jika diperlukan.
   Contoh format (ganti seluruh placeholder dengan nilai penyedia):

   ```dotenv
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
   ```

   Jangan gunakan `localhost`, `127.0.0.1`, atau URL database lokal dari `.env`.
   Simpan URL sebagai rahasia server, tanpa awalan `NEXT_PUBLIC_`.
3. Atur `AUTH_SECRET` dengan nilai acak yang kuat dan sama untuk seluruh
   instance deployment tersebut.
4. Pastikan database online sudah memiliki tabel sesuai `prisma/schema.prisma`
   serta data aplikasi. Database baru yang kosong dapat disiapkan dengan
   `npx prisma db push` dari lingkungan tepercaya dengan `DATABASE_URL` yang
   mengarah ke database baru tersebut. Perintah ini hanya membuat struktur;
   pindahkan data PostgreSQL lokal melalui backup/restore jika ingin
   mempertahankan data yang ada. Tidak ada reset atau seed otomatis saat build.
5. Gunakan **Build Command** `npm run build`, lalu lakukan **Redeploy** setelah
   perubahan environment tersimpan. Build menjalankan `prisma generate`
   sebelum `next build`.

Halaman publik dirender saat request, sehingga build tidak perlu membaca
`SiteSetting`, `Opd`, atau `Artikel`. Pemeriksaan konfigurasi menghentikan build
Vercel dengan pesan yang jelas jika `DATABASE_URL` kosong, bukan PostgreSQL,
atau masih menunjuk localhost. Database online tetap harus dapat diakses saat
aplikasi digunakan; keberhasilan build tidak membuktikan koneksi runtime.

## Supabase: struktur dan seluruh data lokal

Konfigurasi memakai Prisma 6: `DATABASE_URL` untuk pooler transaksi saat
aplikasi berjalan, dan `DIRECT_URL` untuk pooler sesi saat memakai Prisma CLI.
Template tanpa kredensial tersedia di `.env.supabase.example`. Salin hostname
dan project reference yang sebenarnya dari **Supabase > Connect**; contoh
hostname di template tidak boleh digunakan apa adanya. Password yang memiliki
karakter khusus harus di-URL-encode.

### Impor data yang sudah ada

1. Gunakan proyek Supabase yang belum memiliki 28 tabel aplikasi ini. Schema
   `public` bawaan Supabase boleh sudah ada. Jangan jalankan `db push`, seed,
   atau `prisma/supabase/schema.sql` sebelum impor lengkap ini.
2. Buka **Supabase > SQL Editor > New query**, salin seluruh isi
   `prisma/backups/supabase-full.sql`, lalu **Run**. File ini membuat tabel,
   memasukkan seluruh data lokal, membuat indeks dan foreign key, serta
   mengaktifkan RLS. Impor berjalan dalam satu transaksi dan tidak menghapus
   tabel yang sudah ada. Jika tabel aplikasi sudah ada, gunakan target kosong
   atau rencanakan penggabungan data terlebih dahulu; jangan menghapusnya.
3. Hasil query terakhir menunjukkan jumlah baris per tabel. Bandingkan dengan
   `prisma/backups/source-counts.txt`. Query pengecekan juga tersedia di
   `prisma/backups/verify-counts.sql`.
4. Isi `DATABASE_URL` dan `DIRECT_URL` yang sebenarnya pada `.env` untuk
   berpindah ke Supabase secara lokal. Untuk Vercel, isi keduanya lewat
   **Settings > Environment Variables** sesuai environment yang digunakan,
   beserta `AUTH_SECRET`, lalu redeploy dengan `npm run build`.

Koneksi di template menggunakan user `postgres.PROJECT_REF` dari Supabase.
RLS dan pencabutan akses `anon`/`authenticated` melindungi tabel dari Data API;
Prisma mengakses database dari server dengan role PostgreSQL tersebut.
Autentikasi akun aplikasi tetap menggunakan tabel `User` dan hash password
yang ikut dipindahkan, sehingga akun lama tetap tersedia. Kredensial database
harus tetap berada di server.

Untuk membuat **struktur kosong tanpa data lama**, gunakan
`prisma/supabase/schema.sql` saja. Ini alternatif terhadap impor lengkap,
bukan langkah tambahan setelahnya.

### Memperbarui ekspor

Sebelum beralih ke Supabase, jalankan:

```sh
npm run db:export:supabase
```

Jika `.env` sudah mengarah ke Supabase, isi `LOCAL_DATABASE_URL` dengan URL
database lokal sumber, lalu jalankan perintah yang sama. Database lokal harus
aktif. `PG_BIN` dapat menunjuk folder binary PostgreSQL versi sumber.
Ekspor menggunakan snapshot konsisten PostgreSQL dan menyertakan semua tabel
aplikasi beserta data sebenarnya. Jumlah sumber dihitung sesudah ekspor;
hentikan sementara penulisan data selama ekspor akhir dan pemeriksaan jumlah.
File hasil ekspor bersifat privat (termasuk hash password dan data akun) dan
folder `prisma/backups` dikecualikan dari Git.

SQL hanya memindahkan isi database. File foto di `storage/article-images` dan
lampiran di `storage/uploads` perlu dipindahkan terpisah ke penyimpanan
permanen. Penyimpanan file lokal Vercel memerlukan integrasi object storage
agar unggahan baru dapat bertahan.

Referensi: [Koneksi Prisma ke Supabase](https://supabase.com/docs/guides/database/prisma)
dan [Migrasi PostgreSQL ke Supabase](https://supabase.com/docs/guides/platform/migrating-to-supabase/postgres).

## Kecepatan navigasi di Vercel

`vercel.json` menempatkan Functions di Tokyo (`hnd1`), sesuai lokasi Supabase
`ap-northeast-1`. Redeploy agar region ini berlaku. Jika database dipindahkan
ke region lain, sesuaikan region Functions agar tetap dekat dengan database.

Query halaman publik memakai cache server selama 60 detik. Perubahan konten,
profil OPD, master data, dan publikasi dataset melalui aplikasi langsung
menghapus cache terkait. Perubahan langsung lewat SQL Editor terlihat setelah
revalidasi cache. Backoffice tetap membaca data aktual; pemeriksaan sesi hanya
digabungkan dalam request yang sama, tidak disimpan lintas pengguna.

Pool Prisma Supabase memakai tiga koneksi agar query independen tidak harus
antre satu per satu. URL lama dengan `connection_limit=1` disesuaikan menjadi
tiga oleh aplikasi. Loading UI membuat navigasi menampilkan respons segera,
dan menu backoffice mobile menggunakan navigasi Next.js tanpa memuat ulang
seluruh halaman. Request pertama saat cache kosong tetap membutuhkan database.

## Logo dinas OPD

OPD mengunggah logo melalui Profil OPD, lalu klik Simpan Profil. Format PNG,
JPG, atau WebP dengan ukuran maksimal 2 MB. Server memvalidasi gambar,
memperkecilnya hingga 512 piksel, dan menyimpan hasil WebP pada kolom
`OpdProfile.logoUrl` di PostgreSQL sehingga tetap tersedia di Vercel.
Logo default `public/opd-logo-default.svg` ditampilkan jika logo belum diunggah.
Logo yang sama digunakan pada profil, daftar OPD, dan beranda portal publik.

Database lama memerlukan `prisma/updates/add-opd-logo.sql`, kemudian jalankan
`npm run db:generate` saat server berhenti. Penambahan kolom ini sudah diterapkan
pada Supabase yang digunakan pengembangan. Data emoji lama tetap disimpan
untuk kompatibilitas, tetapi tidak lagi digunakan pada tampilan logo OPD.

## Foto artikel

Pengelolaan artikel dan publikasi hanya tersedia untuk role `BAPPERIDA` melalui
`/backoffice/konten`. Role OPD dan Admin tidak memiliki menu atau izin mengubah
konten. Alamat lama `/backoffice/opd-konten` mengarah kembali ke dashboard.
Konten yang sudah tersimpan tetap tersedia sesuai status publikasinya.
Pengujian otorisasi aksi konten: `node scripts/test-content-access.cjs`.

Pada database yang sudah ada, jalankan pembaruan kolom foto sebelum menjalankan versi ini:

```sh
npx prisma db execute --file prisma/updates/add-article-photo.sql --schema prisma/schema.prisma
npm run db:generate
```

Formulir tambah dan edit artikel menerima foto JPG, PNG, atau WebP hingga 5 MB. Foto disimpan di `storage/article-images` dan digunakan pada daftar pengelolaan serta portal berita. Sertakan folder ini dalam cadangan dan pertahankan sebagai penyimpanan permanen pada server.

## Analisis pengunjung website

Menu masyarakat `/analisis-pengunjung` menampilkan jumlah kunjungan halaman,
pengunjung unik dalam periode, total kunjungan keseluruhan, serta grafik dan
rincian harian, bulanan, atau tahunan. Rentang tanggal termasuk kedua batas
tanggal dan menggunakan WITA (Asia/Makassar). Grafik harian dibatasi 366 hari;
gunakan bulanan atau tahunan untuk rentang lebih panjang.

Pencatatan berlangsung saat halaman publik dibuka, dimuat ulang, atau pengguna
berpindah halaman melalui menu. Prefetch dan klik yang tidak membuka halaman
tidak dihitung. Pengunjung unik menggunakan ID acak dalam localStorage browser;
perangkat/browser lain atau penghapusan localStorage dapat dihitung sebagai
pengunjung baru. Tanpa localStorage, ID hanya bertahan selama halaman aktif.
Tidak menyimpan alamat IP atau identitas akun. Data dimulai sejak fitur aktif.
Statistik dibaca langsung tanpa cache; tombol Perbarui data mengambil data terbaru.

Untuk database instalasi lain, jalankan pembaruan berikut dan buat ulang klien
Prisma saat server pengembangan berhenti:

```sh
npx prisma db execute --file prisma/updates/add-website-visits.sql --schema prisma/schema.prisma
npm run db:generate
```

Pengujian tanggal: `node scripts/test-visitor-analytics.cjs`.
Pengujian database dan API dengan server aktif di port 3000:
`node scripts/test-visitor-analytics.cjs --integration`.
Pengujian integrasi membuat data sementara dan membersihkannya kembali.
