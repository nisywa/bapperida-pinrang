import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
