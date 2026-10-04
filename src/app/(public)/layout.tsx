import { publicDb as db } from "@/lib/public-db";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";

// Read public data at request time, without database queries during build.
export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await db.siteSetting.findMany();
  const s = (key: string, fallback = "") => settings.find((x) => x.key === key)?.value ?? fallback;

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7f4]">
      <PublicNavbar siteTitle={s("site_title", "Bapperida Kabupaten Pinrang")} />
      <main className="flex-1">{children}</main>
      <PublicFooter
        address={s("contact_address", "Jalan Bintang No. 1, Macorawalie, Kecamatan Watang Sawitto, Kabupaten Pinrang, Sulawesi Selatan 91212")}
        email={s("contact_email", "bapperida@pinrang.go.id")}
        phone={s("contact_phone", "(0421) 91251")}
      />
    </div>
  );
}
