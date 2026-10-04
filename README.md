# Menjalankan aplikasi secara lokal

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

## Foto artikel

Pada database yang sudah ada, jalankan pembaruan kolom foto sebelum menjalankan versi ini:

```sh
npx prisma db execute --file prisma/updates/add-article-photo.sql --schema prisma/schema.prisma
npm run db:generate
```

Formulir tambah dan edit artikel menerima foto JPG, PNG, atau WebP hingga 5 MB. Foto disimpan di `storage/article-images` dan digunakan pada daftar pengelolaan serta portal berita. Sertakan folder ini dalam cadangan dan pertahankan sebagai penyimpanan permanen pada server.
