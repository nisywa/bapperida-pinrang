import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "Sistem Pelayanan Digital | Bapperida Kabupaten Pinrang",
    template: "%s | Bapperida Kabupaten Pinrang",
  },
  description:
    "Platform terpadu pengelolaan data lintas OPD Kabupaten Pinrang — pengumpulan indikator, verifikasi, visualisasi wilayah, dan publikasi informasi untuk masyarakat.",
  keywords: ["Bapperida", "Pinrang", "Data", "Indikator", "OPD", "Dashboard"],
  openGraph: {
    title: "Sistem Pelayanan Digital Bapperida Kabupaten Pinrang",
    description: "Portal data terpadu Bapperida Kabupaten Pinrang",
    siteName: "Bapperida Pinrang",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
