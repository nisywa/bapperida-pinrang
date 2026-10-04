export function PageLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10">
      <span className="sr-only">Memuat halaman…</span>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="h-8 w-56 rounded-lg bg-slate-200" />
        <div className="h-4 w-3/4 max-w-xl rounded bg-slate-200" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-56 rounded-2xl border border-slate-200 bg-white p-6">
              <div className="h-12 w-12 rounded-xl bg-slate-100" />
              <div className="mt-5 h-5 w-3/4 rounded bg-slate-100" />
              <div className="mt-3 h-4 w-full rounded bg-slate-100" />
              <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
