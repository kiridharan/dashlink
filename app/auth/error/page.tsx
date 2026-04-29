import Link from "next/link";

export const metadata = {
  title: "Confirmation error — DashLink",
};

interface Props {
  searchParams: Promise<{ reason?: string }>;
}

export default async function AuthErrorPage({ searchParams }: Props) {
  const { reason } = await searchParams;

  const message =
    reason === "missing_token"
      ? "The confirmation link is incomplete or has already been used."
      : reason
        ? decodeURIComponent(reason)
        : "Something went wrong while confirming your email.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm text-center">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-zinc-900"
        >
          Dash<span className="text-zinc-400">Link</span>
        </Link>

        <div className="mt-8 rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-6 w-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          <h1 className="text-base font-semibold text-zinc-900">
            Email confirmation failed
          </h1>
          <p className="mt-2 text-sm text-zinc-500">{message}</p>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/signup"
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Create a new account
            </Link>
            <Link
              href="/login"
              className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
