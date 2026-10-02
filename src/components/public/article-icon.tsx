import {
  BarChart3,
  Construction,
  HeartPulse,
  Megaphone,
  Newspaper,
  PanelsTopLeft,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ArticleIcon({ title, className, photoUrl }: { title: string; className?: string; photoUrl?: string | null }) {
  if (photoUrl) return <Image src={photoUrl} alt={`Foto ${title}`} width={160} height={160} unoptimized className="h-full w-full rounded-[inherit] object-cover" />;
  const normalized = title.toLocaleLowerCase("id-ID");
  let Icon = Newspaper;

  if (/kesehatan|posyandu|rumah sakit|puskesmas|stunting/.test(normalized)) {
    Icon = HeartPulse;
  } else if (/jalan|jembatan|infrastruktur|pupr|pembangunan/.test(normalized)) {
    Icon = Construction;
  } else if (/data|statistik|indikator|monitoring|capaian/.test(normalized)) {
    Icon = BarChart3;
  } else if (/digital|sistem|aplikasi|portal/.test(normalized)) {
    Icon = PanelsTopLeft;
  } else if (/pengumuman|agenda|undangan/.test(normalized)) {
    Icon = Megaphone;
  }

  return <Icon aria-hidden="true" className={cn("h-6 w-6", className)} strokeWidth={1.8} />;
}
