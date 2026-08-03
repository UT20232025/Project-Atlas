import { getTranslations } from "next-intl/server";

export default async function DashboardHero() {
  const t = await getTranslations("DashboardHero");

  return (
    <header className="mb-10">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
        {t("eyebrow")}
      </p>

      <h1 className="mt-3 text-4xl font-bold md:text-6xl">
        {t("heading")}
      </h1>

      <p className="mt-3 max-w-2xl text-zinc-400">
        {t("subheadline")}
      </p>
    </header>
  );
}