import { db } from "@/lib/db";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await db.siteSetting.findMany();
  const s = (key: string, fallback = "") => settings.find((x) => x.key === key)?.value ?? fallback;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicNavbar siteTitle={s("site_title", "Bapperida Kabupaten Pinrang")} />
      <main className="flex-1">{children}</main>
      <PublicFooter
        address={s("contact_address", "Pangkajene, Pinrang")}
        email={s("contact_email", "bapperida@pinrang.go.id")}
        phone={s("contact_phone", "(0421) 91251")}
      />
    </div>
  );
}
