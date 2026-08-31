import { NextRequest, NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session) {
    await logActivity({
      actor: session,
      action: "LOGOUT",
      entityType: "Session",
      detail: "Logout",
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
  }
  await destroySession();
  return NextResponse.json({ ok: true });
}
