import Link from "next/link";
import HeroMock from "@/components/landing/HeroMock";
import Reveal from "@/components/landing/Reveal";

const FEATURES = [
  {
    title: "Paste an API. Get a dashboard.",
    body: "Drop any JSON URL — even deeply nested. We auto-detect fields, types, and array paths in seconds.",
  },
  {
    title: "Drag-and-drop builder",
    body: "KPIs, line, bar, pie, and tables on a free-form grid. Resize anything. Auto-saves as you build.",
  },
  {
    title: "Time-travel history",
    body: "Every save creates a version. See a field-level diff and restore any earlier state in one click.",
  },
  {
    title: "Embed anywhere",
    body: "Copy a one-line iframe, an auto-mount script, or a React snippet. Preview at desktop, tablet, and mobile sizes.",
  },
  {
    title: "Scheduled alerts",
    body: "Set thresholds on any KPI. We check on a schedule and ping a webhook or email when something moves.",
  },
  {
    title: "Mobile-first viewer",
    body: "Auto-redirects phones to a stack or swipe layout tuned for small screens. Looks great on any device.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Paste",
    body: "Drop a JSON URL or upload a file. Add a Bearer or API-key header if you need auth.",
  },
  {
    n: "02",
    title: "Build",
    body: "We suggest widgets from your fields. Tweak the metrics, filters, and theme.",
  },
  {
    n: "03",
    title: "Share",
    body: "Toggle public, copy a link or an embed snippet, and you're done.",
  },
];

const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes — DashLink is in open beta. No credit card. We'll announce paid tiers well before they go live.",
  },
  {
    q: "What APIs work?",
    a: "Anything that returns JSON. Bearer tokens, API keys, and basic auth are supported. Nested arrays are flattened automatically.",
  },
  {
    q: "Can I embed dashboards in my site?",
    a: "Yes — every public dashboard ships with iframe, auto-mount script, and React snippet generators. Embeds are sandboxed and respect your theme.",
  },
  {
    q: "How does pricing scale?",
    a: "Beta is unlimited. Paid plans (later) will tier on refresh frequency and number of dashboards, not seats.",
  },
];

const LOGOS = [
  "Stripe",
  "Shopify",
  "GitHub",
  "Linear",
  "Notion",
  "Airtable",
  "PostgREST",
  "Supabase",
  "Hasura",
  "Plaid",
  "HubSpot",
  "Segment",
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-50 text-zinc-900">
      {/* Soft background grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 80%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[520px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(79,70,229,0.08),transparent_70%)]"
      />

      {/* Nav */}
      <header className="relative z-10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Dash<span className="text-zinc-400">Link</span>
          </Link>
          <div className="hidden items-center gap-7 text-sm text-zinc-500 sm:flex">
            <a href="#features" className="hover:text-zinc-900">
              Features
            </a>
            <a href="#how" className="hover:text-zinc-900">
              How it works
            </a>
            <a href="#faq" className="hover:text-zinc-900">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 hover:text-zinc-900"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-10 sm:pt-16">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Open beta — free
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-900 sm:text-6xl">
              Any JSON API,
              <br />
              <span className="bg-gradient-to-r from-indigo-700 to-indigo-500 bg-clip-text text-transparent">
                live dashboard.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-zinc-600 sm:text-lg">
              Paste a URL, drop widgets on a grid, and ship a shareable
              dashboard in under a minute. With versioning, alerts, and embeds
              built in.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="group inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-700"
              >
                Start free
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14M13 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <a
                href="#features"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300"
              >
                See how it works
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <span>No credit card</span>
              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              <span>Public + private dashboards</span>
              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              <span>Embed anywhere</span>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <HeroMock />
          </Reveal>
        </div>
      </section>

      {/* Marquee */}
      <section className="relative z-10 border-y border-zinc-200/70 bg-white/50 py-6 backdrop-blur">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          Works with any JSON API
        </p>
        <div className="relative overflow-hidden">
          <div className="dl-marquee flex w-max gap-12 whitespace-nowrap text-sm font-medium text-zinc-400">
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <span key={`${i}-${name}`} className="opacity-70">
                {name}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-zinc-50 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-zinc-50 to-transparent" />
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 mx-auto max-w-6xl px-6 py-24"
      >
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Everything you need
          </p>
          <h2 className="mt-3 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            From raw JSON to{" "}
            <span className="bg-gradient-to-r from-indigo-700 to-indigo-500 bg-clip-text text-transparent">
              shipped dashboard
            </span>
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <div className="group h-full rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_10px_30px_-15px_rgba(15,23,42,0.25)]">
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-xs font-semibold text-white">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-base font-semibold text-zinc-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {f.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="relative z-10 mx-auto max-w-5xl px-6 py-24">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Three steps
          </p>
          <h2 className="mt-3 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Up and running in{" "}
            <span className="bg-gradient-to-r from-indigo-700 to-indigo-500 bg-clip-text text-transparent">
              60 seconds
            </span>
          </h2>
        </Reveal>

        <div className="relative mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div
            aria-hidden
            className="pointer-events-none absolute left-8 right-8 top-10 hidden h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent sm:block"
          />
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="relative rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-xs font-semibold text-white">
                  {s.n}
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-900">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 mx-auto max-w-3xl px-6 py-24">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-400">
            FAQ
          </p>
          <h2 className="mt-3 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions, answered
          </h2>
        </Reveal>
        <div className="mt-10 divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 60}>
              <details className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-zinc-900">
                  {f.q}
                  <svg
                    className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-180"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                  {f.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 px-8 py-16 text-center text-white sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(99,102,241,0.25),transparent_70%)]"
            />
            <div className="relative">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Ship your first dashboard tonight
              </h2>
              <p className="mx-auto mt-4 max-w-md text-zinc-400">
                Free during open beta. No credit card. No time limit.
              </p>
              <Link
                href="/signup"
                className="group mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
              >
                Get started
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14M13 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-zinc-500 sm:flex-row">
          <p>© 2026 DashLink. Built for the beta.</p>
          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-zinc-900">
              Features
            </a>
            <a href="#how" className="hover:text-zinc-900">
              How
            </a>
            <a href="#faq" className="hover:text-zinc-900">
              FAQ
            </a>
            <Link href="/login" className="hover:text-zinc-900">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
