import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, MapPin, Mail, Phone } from "lucide-react";

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
    <footer className="mt-auto border-t border-[#c1d9c8] bg-[#d7e8db] text-[#355548]">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 p-1.5 shadow-sm ring-1 ring-white">
                <Image src="/logo-kabupaten-pinrang.png" alt="Lambang Kabupaten Pinrang" width={44} height={50} className="h-full w-auto object-contain" />
              </span>
              <div>
                <p className="font-extrabold tracking-[0.08em] text-[#24483a]">BAPPERIDA</p>
                <p className="text-xs text-[#688878]">Kabupaten Pinrang</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-[#527062]">
              Badan Perencanaan Pembangunan, Riset dan Pengembangan Daerah Kabupaten Pinrang.
              Platform terpadu data lintas OPD untuk perencanaan pembangunan berbasis data.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#4e7562]">Tautan Cepat</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {[['/profil','Profil Bapperida'],['/opd','Direktori OPD'],['/berita','Berita & Artikel'],['/data','Data & Statistik'],['/publikasi','Publikasi & Download']].map(([href,label]) => (
                <li key={href}><Link href={href} className="group inline-flex items-center gap-1.5 transition-colors hover:text-[#173c30]">{label}<ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" /></Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#4e7562]">Kontak</h3>
            <ul className="mt-4 space-y-3 text-sm text-[#527062]">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#67927a]" />
                <span>{address}</span>
              </li>
              <li className="flex gap-2.5 items-center">
                <Mail className="h-4 w-4 shrink-0 text-[#67927a]" />
                <span>{email}</span>
              </li>
              <li className="flex gap-2.5 items-center">
                <Phone className="h-4 w-4 shrink-0 text-[#67927a]" />
                <span>{phone}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-[#b9d2c1] pt-6 text-center text-xs text-[#668676]">
          © {new Date().getFullYear()} Bapperida Kabupaten Pinrang — Sistem Pelayanan Digital Terpadu. Data publik diperbarui berdasarkan dataset terverifikasi.
        </div>
      </div>
    </footer>
  );
}
