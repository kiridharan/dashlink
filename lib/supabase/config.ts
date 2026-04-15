function readEnv(name: "NEXT_PUBLIC_SUPABASE_URL") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function readSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url) return url;

  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
}

function readSupabasePublicKey() {
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (publishable) return publishable;

  // Backward compatibility with older Supabase env naming.
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anon) return anon;

  throw new Error(
    "Missing environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
  );
}

export function getSupabaseConfig() {
  return {
    url: readSupabaseUrl(),
    anonKey: readSupabasePublicKey(),
  };
}
