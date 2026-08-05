import { getTranslations } from "next-intl/server";

type DisclaimerProps = {
  className?: string;
};

export default async function Disclaimer({
  className = "",
}: DisclaimerProps) {
  const t = await getTranslations("Disclaimer");

  return (
    <p
      className={`text-xs leading-5 text-zinc-600 ${className}`}
    >
      {t("text")}
    </p>
  );
}
