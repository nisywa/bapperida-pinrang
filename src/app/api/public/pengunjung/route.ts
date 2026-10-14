import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseVisitRange, visitBuckets } from "@/lib/visitor-analytics";

const visitSchema = z.object({
  id: z.uuid(),
  visitorId: z.uuid(),
  pathname: z.string().max(500).regex(/^\/(?!\/|api(?:\/|$)|backoffice(?:\/|$)|login(?:\/|$)|_next(?:\/|$))[^?#]*$/),
});
const noCache = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== request.nextUrl.origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Sumber kunjungan tidak valid." }, { status: 403 });
  }
  // Ignore known crawlers; real visits are recorded after a page opens in the browser.
  if (/bot|crawler|spider|headless|preview/i.test(request.headers.get("user-agent") ?? "")) {
    return new NextResponse(null, { status: 204 });
  }
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Format kunjungan tidak valid." }, { status: 400 }); }
  const parsed = visitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Data kunjungan tidak valid." }, { status: 400 });
  try {
    // A repeated request with the same event ID must never inflate the count.
    await db.websiteVisit.createMany({ data: [parsed.data], skipDuplicates: true });
    return NextResponse.json({ ok: true }, { headers: noCache });
  } catch (error) {
    console.error("Pencatatan kunjungan gagal", error);
    return NextResponse.json({ error: "Kunjungan belum dapat dicatat." }, { status: 503, headers: noCache });
  }
}

export async function GET(request: NextRequest) {
  let range;
  try { range = parseVisitRange(request.nextUrl.searchParams); }
  catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400, headers: noCache });
  }
  const { start, end, granularity, from, until } = range;
  const format = granularity === "day" ? "YYYY-MM-DD" : granularity === "month" ? "YYYY-MM" : "YYYY";
  try {
    // Prisma timestamps are UTC without timezone. Group and filter by WITA boundaries.
    const [series, totals, allTimeVisits] = await db.$transaction([
      db.$queryRaw<{ period: string; visits: bigint; visitors: bigint }[]>(Prisma.sql`
        SELECT to_char("createdAt" + interval '8 hours', ${format}) AS period,
          count(*) AS visits, count(DISTINCT "visitorId") AS visitors
        FROM "WebsiteVisit" WHERE "createdAt" >= ${from} AND "createdAt" < ${until}
        GROUP BY 1 ORDER BY 1
      `),
      db.$queryRaw<{ visits: bigint; visitors: bigint }[]>(Prisma.sql`
        SELECT count(*) AS visits, count(DISTINCT "visitorId") AS visitors
        FROM "WebsiteVisit" WHERE "createdAt" >= ${from} AND "createdAt" < ${until}
      `),
      db.websiteVisit.count(),
    ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    const rows = new Map(series.map(row => [row.period, row]));
    return NextResponse.json({
      start, end, granularity, allTimeVisits,
      visits: Number(totals[0].visits), visitors: Number(totals[0].visitors),
      series: visitBuckets(start, end, granularity).map(period => ({
        period, visits: Number(rows.get(period)?.visits ?? 0), visitors: Number(rows.get(period)?.visitors ?? 0),
      })),
    }, { headers: noCache });
  } catch (error) {
    console.error("Analisis pengunjung gagal", error);
    return NextResponse.json({ error: "Statistik belum dapat dimuat. Silakan coba lagi." }, { status: 503, headers: noCache });
  }
}
