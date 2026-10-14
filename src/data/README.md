# Batas kecamatan Kabupaten Pinrang

`pinrang-kecamatan.json` memuat 12 kecamatan dari resource **Batas Administrasi
Kecamatan**, portal Satu Data Kabupaten Pinrang, diperbarui 16 November 2023.

- Dataset: https://data.pinrangkab.go.id/dataset/batas-administrasi-kecamatan-kabupaten-pinrang1
- Resource: https://data.pinrangkab.go.id/dataset/2aa6eb6a-6ead-404e-96be-b56cebf67052/resource/f1fd0364-561b-49f6-af17-b581fc8832a4/download/bts_kec.geojson

Koordinat WGS84 disimpan dengan urutan longitude, latitude dan dibulatkan ke
enam angka desimal untuk mengurangi ukuran file. Seluruh ring dan bagian
MultiPolygon dipertahankan. Properti dipangkas menjadi nama kecamatan.

`getPinrangGeometry` mencocokkan nama kecamatan ke wilayah aplikasi tanpa
mengubah ID, kode wilayah, jawaban, maupun snapshot dataset di database.
Peta publik, analitik Bapperida, dan analitik OPD memakai sumber yang sama.
Data ini untuk visualisasi; edisinya ditampilkan pada atribusi di bawah peta.
