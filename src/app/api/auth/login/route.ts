import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
    }

    const user = await authenticate(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Kredensial tidak valid atau akun tidak aktif." },
        { status: 401 }
      );
    }

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
