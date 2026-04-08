import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-2xl text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Now in beta
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900">
          Dash<span className="text-zinc-400">Link</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-zinc-500">
          Paste any public API endpoint. Get a live, drag-and-drop dashboard —
          shareable in one link.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="flex h-11 w-44 items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="flex h-11 w-44 items-center justify-center rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 transition hover:border-zinc-400"
          >
            Sign in
          </Link>
        </div>

        {/* Feature grid */}
        <div className="mt-16 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
          {[
            {
              icon: "⚡",
              title: "Auto-detect visuals",
              body: "Schema detection maps your JSON to KPI cards, line charts, and bar charts automatically.",
            },
            {
              icon: "🧩",
              title: "Drag & drop builder",
              body: "Rearrange and resize every widget on a grid canvas. No configuration, no code.",
            },
            {
              icon: "🔗",
              title: "Shareable link",
              body: "Every dashboard gets a permanent URL your team can bookmark and revisit.",
            },
          ].map(({ icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 text-xl">{icon}</div>
              <p className="text-sm font-semibold text-zinc-800">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-16 text-xs text-zinc-300">
        DashLink — no drag-and-drop builders to configure. Just data.
      </footer>
    </main>
  );
}
