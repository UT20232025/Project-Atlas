import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";

type Translate = (
  key: string,
  params?: Record<string, string | number>
) => string;

export function resolveReasonText(
  t: Translate,
  locale: string,
  reason: AtlasReasonCode
): string {
  if (!reason.params) {
    return t(reason.code);
  }

  const resolvedParams: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(reason.params)) {
    if (Array.isArray(value)) {
      const labels = value.map((name) =>
        t(`FACTOR_LABEL_${name.toUpperCase()}`)
      );

      resolvedParams[key] = new Intl.ListFormat(locale, {
        style: "long",
        type: "conjunction",
      }).format(labels);
    } else {
      resolvedParams[key] = value;
    }
  }

  return t(reason.code, resolvedParams);
}
