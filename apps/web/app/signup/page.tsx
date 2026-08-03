import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

import Button from "@/components/ui/button";
import Input from "@/components/ui/Input";

import { signup } from "./actions";

type SignupPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({
  searchParams,
}: SignupPageProps) {
  const { error } = await searchParams;
  const t = await getTranslations("Signup");
  const ERROR_MESSAGES: Record<string, string> = {
    invalid_input: t("errorInvalidInput"),
    email_taken: t("errorEmailTaken"),
    invalid_invite_code: t("errorInvalidInviteCode"),
  };
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;
  const inviteCodeRequired = Boolean(process.env.BETA_INVITE_CODE);

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
            {t("heading")}
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            {t("subheading")}
          </p>

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          <form action={signup} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs text-zinc-500"
              >
                {t("email")}
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
                {t("password")}
              </label>

              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full"
              />

              <p className="text-xs text-zinc-600">
                {t("passwordHint")}
              </p>
            </div>

            {inviteCodeRequired && (
              <div className="space-y-1.5">
                <label
                  htmlFor="inviteCode"
                  className="text-xs text-zinc-500"
                >
                  {t("inviteCode")}
                </label>

                <Input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  autoComplete="off"
                  required
                  className="w-full"
                />

                <p className="text-xs text-zinc-600">
                  {t("inviteCodeHint")}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full">
              {t("submit")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            {t("haveAccount")}{" "}
            <Link href="/login" className="text-white underline">
              {t("logInLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
