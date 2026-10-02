UPDATE "Wilayah" SET "nama" = CASE "nama"
  WHEN 'Batu Lapide' THEN 'Batu Lappa'
  WHEN 'Maritengngae' THEN 'Lembang'
  WHEN 'Watang Pulu' THEN 'Watang Sawitto'
END
WHERE "jenis" = 'KECAMATAN' AND "nama" IN ('Batu Lapide', 'Maritengngae', 'Watang Pulu');
