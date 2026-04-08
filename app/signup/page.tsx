import AuthCard from "@/components/auth/AuthCard";

export const metadata = {
  title: "Sign up — DashLink",
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <AuthCard mode="signup" />
    </main>
  );
}
