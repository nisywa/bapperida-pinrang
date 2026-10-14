import { UsersRound } from "lucide-react";
import { VisitorDashboard } from "@/components/public/visitor-dashboard";

export const metadata = { title: "Analisis Pengunjung Website" };

export default function VisitorAnalyticsPage() {
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
    <div className="mb-8">
      <span className="mb-4 inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-700"><UsersRound className="h-7 w-7" /></span>
      <h1 className="text-3xl font-bold text-[#24483a]">Analisis Pengunjung Website</h1>
      <p className="mt-3 text-slate-600">Pantau jumlah kunjungan dan tren pengunjung portal Bapperida Kabupaten Pinrang.</p>
    </div>
    <VisitorDashboard />
  </div>;
}
