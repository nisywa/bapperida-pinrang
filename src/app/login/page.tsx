"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Landmark, Lock, Mail, Loader2, ArrowLeft, ShieldCheck, UserCog, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const DEMO_ACCOUNTS = [
  { role: "Administrator", icon: UserCog, email: "admin@pinrang.go.id", password: "Admin#123", desc: "Kelola user, master data, audit log" },
  { role: "Bapperida", icon: ShieldCheck, email: "bapperida@pinrang.go.id", password: "Bapperida#123", desc: "Monitoring, verifikasi, publikasi data" },
  { role: "OPD", icon: Building2, email: "dinaskesehatan@pinrang.go.id", password: "Opd#123", desc: "Isi indikator, kelola konten OPD" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doLogin(e?: React.FormEvent, creds?: { email: string; password: string }) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds ?? { email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login gagal.");
        return;
      }
      router.push("/backoffice");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      {/* Sisi kiri: branding */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-8 text-white lg:w-1/2 lg:p-14">
        <div className="absolute inset-0 opacity-10" aria-hidden>
          <svg className="h-full w-full" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice">
            <g fill="none" stroke="white" strokeWidth="1.5">
              <polygon points="80,100 240,80 280,200 140,240" />
              <polygon points="240,80 400,110 420,230 280,200" />
              <polygon points="140,240 280,200 300,340 160,360" />
              <polygon points="280,200 420,230 440,360 300,340" />
              <polygon points="400,110 540,140 560,260 420,230" />
            </g>
          </svg>
        </div>
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-emerald-200 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Kembali ke portal
          </Link>
          <div className="mt-10 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Landmark className="h-7 w-7" />
            </span>
            <div>
              <p className="text-lg font-bold">BAPPERIDA</p>
              <p className="text-sm text-emerald-200">Kabupaten Pinrang</p>
            </div>
          </div>
          <h1 className="mt-10 max-w-md text-3xl font-bold leading-tight">
            Sistem Pelayanan Digital Terpadu
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-emerald-100/90">
            Backoffice untuk Administrator, Bapperida, dan seluruh OPD. Satu aplikasi, satu basis
            data logis, dengan hak akses berbasis peran dan cakupan OPD.
          </p>
          <div className="mt-8 flex items-center gap-6 text-xs text-emerald-200/80">
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> RBAC + Scope OPD</span>
            <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4" /> Audit Trail</span>
          </div>
        </div>
        <p className="relative mt-10 text-xs text-emerald-300/70">
          © 2026 Pemerintah Kabupaten Pinrang · Hanya untuk perangkat daerah
        </p>
      </div>

      {/* Sisi kanan: form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-slate-900">Login Internal</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Masukkan kredensial akun resmi Anda.
          </p>

          <form onSubmit={doLogin} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@pinrang.go.id"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Kata Sandi</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          {/* Akun demo */}
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Akun Demo (klik untuk masuk cepat)
            </p>
            <div className="mt-3 space-y-2.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={loading}
                  onClick={() => doLogin(undefined, { email: acc.email, password: acc.password })}
                  className="w-full"
                >
                  <Card className="text-left transition-all hover:border-emerald-300 hover:shadow-md disabled:opacity-60">
                    <CardContent className="flex items-center gap-3 p-3.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <acc.icon className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{acc.role}</p>
                        <p className="truncate text-xs text-slate-500">{acc.desc}</p>
                      </div>
                      <span className="shrink-0 rounded bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600">
                        {acc.password}
                      </span>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
