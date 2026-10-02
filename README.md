# Menjalankan aplikasi secara lokal

Aplikasi menggunakan **PostgreSQL**, sesuai `prisma/schema.prisma`.
Koneksi pengembangan saat ini berada di `localhost:5433`. Menyalakan
Laragon saja belum menyalakan database lokal proyek ini.

Jalankan dari folder proyek:

```sh
npm run dev
```

Pada Windows, langkah `predev` menyalakan database yang sudah ada di
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

## Foto artikel

Pada database yang sudah ada, jalankan pembaruan kolom foto sebelum menjalankan versi ini:

```sh
npx prisma db execute --file prisma/updates/add-article-photo.sql --schema prisma/schema.prisma
npm run db:generate
```

Formulir tambah dan edit artikel menerima foto JPG, PNG, atau WebP hingga 5 MB. Foto disimpan di `storage/article-images` dan digunakan pada daftar pengelolaan serta portal berita. Sertakan folder ini dalam cadangan dan pertahankan sebagai penyimpanan permanen pada server.
