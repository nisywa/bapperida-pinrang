import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { checkLoginRateLimit, clearLoginFailures, recordLoginFailure } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const clientAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
    const limitKey = `${clientAddress}:${normalizedEmail}`;
    const rateLimit = checkLoginRateLimit(limitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login. Silakan coba kembali beberapa menit lagi." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const user = await authenticate(normalizedEmail, password);
    if (!user) {
      recordLoginFailure(limitKey);
      return NextResponse.json(
        { error: "Kredensial tidak valid atau akun tidak aktif." },
        { status: 401 }
      );
    }

    clearLoginFailures(limitKey);

    await createSession(user);
    await logActivity({
      actor: user,
      action: "LOGIN",
      entityType: "Session",
      detail: `Login berhasil sebagai ${user.role}`,
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ ok: true, role: user.role });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
