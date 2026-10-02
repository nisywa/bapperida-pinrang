"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Mail, Loader2, ArrowLeft, ShieldCheck, UserCog, Building2, CheckCircle2 } from "lucide-react";
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
    <div className="flex min-h-screen flex-col bg-[#f5f7f4] lg:flex-row">
      {/* Sisi kiri: branding */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-[#d7e9db] p-6 text-[#294f40] lg:w-[46%] lg:p-14">
        <div className="absolute -right-24 -top-20 h-96 w-96 rounded-full bg-white/60 blur-3xl" aria-hidden />
        <div className="absolute inset-0 opacity-[0.09]" aria-hidden>
          <svg className="h-full w-full" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice">
            <g fill="none" stroke="#47715d" strokeWidth="1.5">
              <polygon points="80,100 240,80 280,200 140,240" />
              <polygon points="240,80 400,110 420,230 280,200" />
              <polygon points="140,240 280,200 300,340 160,360" />
              <polygon points="280,200 420,230 440,360 300,340" />
              <polygon points="400,110 540,140 560,260 420,230" />
            </g>
          </svg>
        </div>
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-3 py-2 text-sm text-[#416856] transition-colors hover:bg-white/75 hover:text-[#173c30]">
            <ArrowLeft className="h-4 w-4" /> Kembali ke portal
          </Link>
          <div className="mt-8 flex items-center gap-4 lg:mt-12">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 p-2 shadow-sm ring-1 ring-white backdrop-blur">
              <Image src="/logo-kabupaten-pinrang.png" alt="Lambang Kabupaten Pinrang" width={46} height={53} className="h-full w-auto object-contain" priority />
            </span>
            <div>
              <p className="text-lg font-extrabold tracking-[0.08em]">BAPPERIDA</p>
              <p className="text-sm text-[#668676]">Kabupaten Pinrang</p>
            </div>
          </div>
          <h1 className="mt-8 max-w-md text-3xl font-bold leading-tight tracking-[-0.03em] lg:mt-12 lg:text-4xl">
            Sistem Pelayanan Digital Terpadu
          </h1>
          <p className="mt-5 hidden max-w-md text-sm leading-7 text-[#527062] sm:block">
            Backoffice untuk Administrator, Bapperida, dan seluruh OPD. Satu aplikasi, satu basis
            data logis, dengan hak akses berbasis peran dan cakupan OPD.
          </p>
          <div className="mt-9 hidden space-y-3 text-sm text-[#527062] lg:block">
            <span className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-[#67927a]" /> Akses aman sesuai peran pengguna</span>
            <span className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-[#67927a]" /> Cakupan data terpisah untuk setiap OPD</span>
            <span className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-[#67927a]" /> Setiap aktivitas tercatat dan dapat diaudit</span>
          </div>
        </div>
        <p className="relative mt-10 hidden text-xs text-[#668676] lg:block">
          © 2026 Pemerintah Kabupaten Pinrang · Hanya untuk perangkat daerah
        </p>
      </div>

      {/* Sisi kanan: form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-md rounded-3xl border border-white bg-white/85 p-6 shadow-[0_24px_60px_-38px_rgba(26,68,53,0.55)] backdrop-blur md:p-8">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7efe9] text-[#376653]"><Lock className="h-5 w-5" /></span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Login Internal</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Masukkan kredensial akun resmi Anda.
          </p>

          <form onSubmit={doLogin} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@pinrang.go.id"
                  className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-none focus-visible:ring-[#7ba08d]/30"
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
                  className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-none focus-visible:ring-[#7ba08d]/30"
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

            <Button type="submit" className="h-11 w-full bg-[#2d604e] hover:bg-[#254f41]" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          {/* Akun demo */}
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Akses demo cepat
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
                  <Card className="text-left transition-all hover:-translate-y-0.5 hover:border-[#bed1c4] hover:shadow-md disabled:opacity-60">
                    <CardContent className="flex items-center gap-3 p-3.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e9f0eb] text-[#376653]">
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
