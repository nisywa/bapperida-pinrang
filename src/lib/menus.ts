import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Users, Database, ScrollText, MonitorCheck,
  ClipboardList, CheckSquare, BellRing, FileBarChart, Newspaper,
  FormInput, Building2, UserCircle,
} from "lucide-react";

export type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: string;
};

export const MENUS: Record<string, MenuItem[]> = {
  ADMIN: [
    { href: "/backoffice", label: "Dashboard", icon: LayoutDashboard, group: "Umum" },
    { href: "/backoffice/admin/pengguna", label: "Manajemen Pengguna", icon: Users, group: "Administrasi" },
    { href: "/backoffice/admin/master", label: "Master Data", icon: Database, group: "Administrasi" },
    { href: "/backoffice/admin/audit-log", label: "Audit Log", icon: ScrollText, group: "Administrasi" },
    { href: "/backoffice/monitoring", label: "Monitoring Data", icon: MonitorCheck, group: "Data" },
    { href: "/backoffice/verifikasi", label: "Verifikasi", icon: CheckSquare, group: "Data" },
    { href: "/backoffice/konten", label: "Konten Portal", icon: Newspaper, group: "Konten" },
  ],
  BAPPERIDA: [
    { href: "/backoffice", label: "Dashboard", icon: LayoutDashboard, group: "Umum" },
    { href: "/backoffice/monitoring", label: "Monitoring Progres", icon: MonitorCheck, group: "Pengumpulan Data" },
    { href: "/backoffice/penugasan", label: "Penugasan Indikator", icon: ClipboardList, group: "Pengumpulan Data" },
    { href: "/backoffice/verifikasi", label: "Verifikasi Data", icon: CheckSquare, group: "Verifikasi" },
    { href: "/backoffice/notifikasi", label: "Pusat Notifikasi", icon: BellRing, group: "Verifikasi" },
    { href: "/backoffice/analitik", label: "Dashboard Analitik", icon: FileBarChart, group: "Analitik" },
    { href: "/backoffice/dataset", label: "Dataset Publik", icon: Database, group: "Data Publik" },
    { href: "/backoffice/konten", label: "Konten Portal", icon: Newspaper, group: "Konten" },
  ],
  OPD: [
    { href: "/backoffice", label: "Dashboard", icon: LayoutDashboard, group: "Umum" },
    { href: "/backoffice/pengisian", label: "Pengisian Data", icon: FormInput, group: "Pengisian" },
    { href: "/backoffice/opd-analitik", label: "Visualisasi Data", icon: FileBarChart, group: "Analitik" },
    { href: "/backoffice/opd-konten", label: "Konten OPD", icon: Newspaper, group: "Konten" },
    { href: "/backoffice/opd-profil", label: "Profil OPD", icon: Building2, group: "Konten" },
    { href: "/backoffice/opd-akun", label: "Akun Saya", icon: UserCircle, group: "Akun" },
  ],
};
