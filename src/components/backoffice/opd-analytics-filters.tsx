"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Choice = { indicatorCode: string; indicatorName: string; periodId: string; periodName: string };
export function OpdAnalyticsFilters({ choices, indicatorCode, periodId }: { choices: Choice[]; indicatorCode: string; periodId: string }) {
  const router = useRouter();
  const [indicator, setIndicator] = useState(indicatorCode);
  const [period, setPeriod] = useState(periodId);
  const indicators = [...new Map(choices.map(choice => [choice.indicatorCode, choice])).values()];
  const periods = choices.filter(choice => choice.indicatorCode === indicator);
  return <form className="grid gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={event => {
    event.preventDefault(); router.push(`/backoffice/opd-analitik?${new URLSearchParams({ indikator: indicator, periode: period })}`);
  }}>
    <label className="space-y-2 text-sm font-medium">Indikator ({indicators.length})<select value={indicator} onChange={event => { setIndicator(event.target.value); setPeriod(choices.find(choice => choice.indicatorCode === event.target.value)?.periodId ?? ""); }} className="mt-2 block h-10 w-full rounded-lg border bg-white px-3 text-sm">{indicators.map(choice => <option key={choice.indicatorCode} value={choice.indicatorCode}>{choice.indicatorName}</option>)}</select></label>
    <label className="space-y-2 text-sm font-medium">Periode<select value={period} onChange={event => setPeriod(event.target.value)} className="mt-2 block h-10 w-full rounded-lg border bg-white px-3 text-sm">{periods.map(choice => <option key={choice.periodId} value={choice.periodId}>{choice.periodName}</option>)}</select></label>
    <Button type="submit" className="h-10 bg-emerald-700 hover:bg-emerald-800">Tampilkan</Button>
  </form>;
}
