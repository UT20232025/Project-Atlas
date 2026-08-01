import Image from "next/image";
import Link from "next/link";

import Button from "@/components/ui/button";
import Input from "@/components/ui/Input";

import { login } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Feil e-post eller passord.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6 text-white"
      style={{ background: "var(--app-backdrop)" }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo-full.png"
            alt="Genwelth AI"
            width={1095}
            height={821}
            priority
            className="h-auto w-48"
          />
        </div>

        <div className="atlas-card rounded-2xl p-6">
          <h1 className="text-xl font-bold text-white">
            Logg inn
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Fortsett til Genwelth AI
          </p>

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          <form action={login} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs text-zinc-500"
              >
                E-post
              </label>

              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs text-zinc-500"
              >
                Passord
              </label>

              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full"
              />
            </div>

            <Button type="submit" className="w-full">
              Logg inn
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Ingen konto?{" "}
            <Link
              href="/signup"
              className="text-white underline"
            >
              Registrer deg
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
