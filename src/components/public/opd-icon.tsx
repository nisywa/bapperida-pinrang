import {
  Building2,
  Factory,
  GraduationCap,
  HardHat,
  HeartHandshake,
  HeartPulse,
  House,
  RadioTower,
  Wheat,
} from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { match: /kesehatan/, icon: HeartPulse, color: "from-emerald-50 to-teal-100/70 text-emerald-700 ring-emerald-200/70" },
  { match: /pendidikan|kebudayaan/, icon: GraduationCap, color: "from-indigo-50 to-violet-100/70 text-indigo-600 ring-indigo-200/70" },
  { match: /pekerjaan umum|penataan ruang|pupr/, icon: HardHat, color: "from-amber-50 to-orange-100/70 text-amber-700 ring-amber-200/70" },
  { match: /perindustrian|perdagangan|koperasi/, icon: Factory, color: "from-sky-50 to-cyan-100/70 text-sky-700 ring-sky-200/70" },
  { match: /sosial/, icon: HeartHandshake, color: "from-rose-50 to-pink-100/70 text-rose-600 ring-rose-200/70" },
  { match: /pangan|pertanian/, icon: Wheat, color: "from-lime-50 to-green-100/70 text-lime-700 ring-lime-200/70" },
  { match: /komunikasi|informatika/, icon: RadioTower, color: "from-cyan-50 to-teal-100/70 text-cyan-700 ring-cyan-200/70" },
  { match: /masyarakat|desa/, icon: House, color: "from-orange-50 to-amber-100/70 text-orange-700 ring-orange-200/70" },
];

export function OpdIcon({ name, className }: { name: string; className?: string }) {
  const category = categories.find(({ match }) => match.test(name.toLocaleLowerCase("id-ID")));
  const Icon = category?.icon ?? Building2;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br shadow-sm ring-1 ring-inset transition-transform duration-300 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:scale-105",
        category?.color ?? "from-slate-50 to-slate-100 text-slate-600 ring-slate-200/70",
        className,
      )}
    >
      <span className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-white/50" />
      <Icon className="relative h-7 w-7" strokeWidth={1.7} />
    </span>
  );
}
