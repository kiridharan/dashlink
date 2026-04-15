import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a0f] text-white">
      {/* ---- Gradient blobs ---- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-150 w-150 rounded-full bg-violet-600/30 blur-[160px]" />
        <div className="absolute right-[-10%] top-[10%] h-125 w-125 rounded-full bg-fuchsia-500/20 blur-[140px]" />
        <div className="absolute bottom-[-5%] left-[30%] h-125 w-125 rounded-full bg-cyan-500/20 blur-[140px]" />
        <div className="absolute bottom-[20%] right-[10%] h-87.5 w-87.5 rounded-full bg-amber-500/15 blur-[120px]" />
      </div>

      {/* ---- Floating grid pattern ---- */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ---- Nav ---- */}
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-bold tracking-tight">
          Dash
          <span className="bg-linear-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Link
          </span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ---- Hero ---- */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-20 text-center sm:pt-28">
        {/* Beta badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Beta — free while we build
        </div>

        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-7xl">
          Turn any{" "}
          <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            API
          </span>{" "}
          into a{" "}
          <span className="bg-linear-to-r from-cyan-400 via-sky-400 to-blue-400 bg-clip-text text-transparent">
            dashboard
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          Paste a public JSON endpoint. Get a drag-and-drop dashboard with
          charts, KPIs, and filters — shareable in one link.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 px-8 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30"
          >
            <span className="relative z-10">
              Start building — it&apos;s free
            </span>
            <div className="absolute inset-0 bg-linear-to-r from-violet-500 to-fuchsia-500 opacity-0 transition group-hover:opacity-100" />
          </Link>
          <Link
            href="#features"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-medium text-zinc-300 backdrop-blur transition hover:border-white/20 hover:text-white"
          >
            See how it works
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Link>
        </div>

        {/* Mockup preview */}
        <div className="relative mx-auto mt-16 max-w-3xl">
          <div className="absolute -inset-4 rounded-3xl bg-linear-to-r from-violet-600/20 via-fuchsia-600/20 to-cyan-600/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur">
            <div className="rounded-xl bg-[#111118] p-4 sm:p-6">
              {/* Fake browser chrome */}
              <div className="mb-4 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                </div>
                <div className="ml-4 flex-1 rounded-md bg-white/5 px-3 py-1.5">
                  <span className="text-[11px] text-zinc-500">
                    dashlink.app/view/sales-q4
                  </span>
                </div>
              </div>
              {/* Dashboard grid mockup */}
              <div className="grid grid-cols-4 gap-3">
                {/* KPI cards */}
                {[
                  {
                    label: "Revenue",
                    value: "$128.4K",
                    color: "from-violet-500 to-purple-600",
                    delta: "+12.3%",
                  },
                  {
                    label: "Users",
                    value: "3,847",
                    color: "from-cyan-500 to-blue-600",
                    delta: "+8.1%",
                  },
                  {
                    label: "Orders",
                    value: "1,209",
                    color: "from-fuchsia-500 to-pink-600",
                    delta: "+22.7%",
                  },
                  {
                    label: "Avg. Order",
                    value: "$106",
                    color: "from-amber-500 to-orange-600",
                    delta: "+3.4%",
                  },
                ].map(({ label, value, color, delta }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/5 bg-white/3 p-3"
                  >
                    <p className="text-[10px] font-medium text-zinc-500">
                      {label}
                    </p>
                    <p
                      className={`mt-1 bg-linear-to-r ${color} bg-clip-text text-xl font-bold text-transparent sm:text-2xl`}
                    >
                      {value}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-emerald-400">
                      {delta}
                    </p>
                  </div>
                ))}
                {/* Chart areas */}
                <div className="col-span-2 flex h-32 items-end gap-1 rounded-xl border border-white/5 bg-white/3 p-3 sm:h-40">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-linear-to-t from-violet-600 to-fuchsia-500"
                        style={{ height: `${h}%`, opacity: 0.6 + i * 0.03 }}
                      />
                    ),
                  )}
                </div>
                <div className="col-span-2 flex h-32 flex-col items-center justify-center rounded-xl border border-white/5 bg-white/3 p-3 sm:h-40">
                  {/* Donut mockup */}
                  <svg
                    viewBox="0 0 36 36"
                    className="h-20 w-20 sm:h-24 sm:w-24"
                  >
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="rgba(139,92,246,0.5)"
                      strokeWidth="3"
                      strokeDasharray="40 60"
                      strokeDashoffset="25"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="rgba(236,72,153,0.5)"
                      strokeWidth="3"
                      strokeDasharray="25 75"
                      strokeDashoffset="85"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="rgba(6,182,212,0.5)"
                      strokeWidth="3"
                      strokeDasharray="20 80"
                      strokeDashoffset="60"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="rgba(251,191,36,0.4)"
                      strokeWidth="3"
                      strokeDasharray="15 85"
                      strokeDashoffset="40"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Features ---- */}
      <section
        id="features"
        className="relative z-10 mx-auto max-w-5xl px-6 py-20"
      >
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-violet-400">
          Everything you need
        </p>
        <h2 className="mt-3 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          From JSON to{" "}
          <span className="bg-linear-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            live dashboard
          </span>{" "}
          in seconds
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: (
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  />
                </svg>
              ),
              color: "from-violet-500 to-purple-600",
              glow: "violet",
              title: "Auto-detect schema",
              body: "Drop in a URL — we detect field types, suggest charts, and build your first dashboard automatically.",
            },
            {
              icon: (
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z"
                  />
                </svg>
              ),
              color: "from-cyan-500 to-blue-600",
              glow: "cyan",
              title: "Drag & drop builder",
              body: "Rearrange KPIs, charts, and tables on a free-form grid. Resize anything. Zero code required.",
            },
            {
              icon: (
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              ),
              color: "from-fuchsia-500 to-pink-600",
              glow: "fuchsia",
              title: "Smart aggregations",
              body: "Sum, average, count, distinct — choose metrics per widget. Group by time, category, or multiple dimensions.",
            },
            {
              icon: (
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                  />
                </svg>
              ),
              color: "from-amber-500 to-orange-600",
              glow: "amber",
              title: "Global filters",
              body: "Filter by value, text search, or date range. Every widget updates instantly. Compare periods for KPIs.",
            },
            {
              icon: (
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.303-3.558a4.5 4.5 0 00-1.242-7.244l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757"
                  />
                </svg>
              ),
              color: "from-emerald-500 to-teal-600",
              glow: "emerald",
              title: "Share in one click",
              body: "Every dashboard gets a permanent public URL. Share with your team — no login needed to view.",
            },
            {
              icon: (
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                  />
                </svg>
              ),
              color: "from-rose-500 to-red-600",
              glow: "rose",
              title: "Beautiful themes",
              body: "Switch between light, dark, and custom themes. Your dashboards look polished out of the box.",
            },
          ].map(({ icon, color, glow, title, body }) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-white/6 bg-white/2 p-6 transition hover:border-white/10 hover:bg-white/4"
            >
              <div
                className={`mb-4 inline-flex rounded-xl bg-linear-to-br ${color} p-2.5 text-white shadow-lg shadow-${glow}-500/20`}
              >
                {icon}
              </div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-20">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-cyan-400">
          Three steps
        </p>
        <h2 className="mt-3 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Up and running in{" "}
          <span className="bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            60 seconds
          </span>
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            {
              step: "01",
              color: "text-violet-400",
              border: "border-violet-500/30",
              title: "Paste your URL",
              body: "Any public JSON API endpoint. We fetch the data and analyze the schema instantly.",
            },
            {
              step: "02",
              color: "text-fuchsia-400",
              border: "border-fuchsia-500/30",
              title: "Customize widgets",
              body: "Drag, resize, and configure. Pick metrics, groupings, filters, and themes.",
            },
            {
              step: "03",
              color: "text-cyan-400",
              border: "border-cyan-500/30",
              title: "Share the link",
              body: "Hit publish and share a permanent URL. Anyone can view your dashboard, no account needed.",
            },
          ].map(({ step, color, border, title, body }) => (
            <div
              key={step}
              className={`rounded-2xl border ${border} bg-white/2 p-6`}
            >
              <span className={`text-3xl font-black ${color}`}>{step}</span>
              <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10 px-8 py-16 backdrop-blur sm:px-16">
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-violet-600/20 blur-[80px]" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-cyan-600/20 blur-[80px]" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to build your first dashboard?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-zinc-400">
              Join the beta — completely free. No credit card, no time limit.
            </p>
            <Link
              href="/signup"
              className="group relative mt-8 inline-flex h-12 items-center justify-center overflow-hidden rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 px-8 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30"
            >
              <span className="relative z-10">Get started free →</span>
              <div className="absolute inset-0 bg-linear-to-r from-violet-500 to-fuchsia-500 opacity-0 transition group-hover:opacity-100" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-zinc-500">
        © 2026 DashLink. Built for the beta.
      </footer>
    </main>
  );
}
