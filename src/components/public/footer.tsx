import Link from "next/link";
import { Landmark, MapPin, Mail, Phone } from "lucide-react";

export function PublicFooter({
  address,
  email,
  phone,
}: {
  address: string;
  email: string;
  phone: string;
}) {
  return (
    <footer className="mt-auto bg-emerald-950 text-emerald-100">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-800 text-white">
                <Landmark className="h-6 w-6" />
              </span>
              <div>
                <p className="font-bold text-white">BAPPERIDA</p>
                <p className="text-xs text-emerald-300">Kabupaten Pinrang</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-emerald-200/90">
              Badan Perencanaan Pembangunan, Riset dan Pengembangan Daerah Kabupaten Pinrang.
              Platform terpadu data lintas OPD untuk perencanaan pembangunan berbasis data.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Tautan Cepat</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/profil" className="hover:text-white transition-colors">Profil Bapperida</Link></li>
              <li><Link href="/opd" className="hover:text-white transition-colors">Direktori OPD</Link></li>
              <li><Link href="/berita" className="hover:text-white transition-colors">Berita &amp; Artikel</Link></li>
              <li><Link href="/data" className="hover:text-white transition-colors">Data &amp; Statistik</Link></li>
              <li><Link href="/publikasi" className="hover:text-white transition-colors">Publikasi &amp; Download</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Kontak</h3>
            <ul className="mt-4 space-y-3 text-sm text-emerald-200/90">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{address}</span>
              </li>
              <li className="flex gap-2.5 items-center">
                <Mail className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{email}</span>
              </li>
              <li className="flex gap-2.5 items-center">
                <Phone className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{phone}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-emerald-800/60 pt-6 text-center text-xs text-emerald-300/80">
          © {new Date().getFullYear()} Bapperida Kabupaten Pinrang — Sistem Pelayanan Digital Terpadu. Data publik diperbarui berdasarkan dataset terverifikasi.
        </div>
      </div>
    </footer>
  );
}
