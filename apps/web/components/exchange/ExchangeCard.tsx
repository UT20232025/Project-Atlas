import { getLocale, getTranslations } from "next-intl/server";

import {
  connectExchange,
  disconnectExchange,
} from "@/app/exchange/actions";
import Button from "@/components/ui/button";
import type { ExchangeConnectionView } from "@/lib/exchange/connection";
import {
  EXCHANGE_LABELS,
  SUPPORTED_EXCHANGES,
  exchangeLabel,
} from "@/lib/exchange/registry";

type ExchangeCardProps = {
  configured: boolean;
  connection: ExchangeConnectionView | null;
  status?: string;
};

export default async function ExchangeCard({
  configured,
  connection,
  status,
}: ExchangeCardProps) {
  const t = await getTranslations("Exchange");
  const locale = await getLocale();

  const statusMessage =
    status === "connected"
      ? { tone: "text-emerald-400", text: t("statusConnected") }
      : status === "disconnected"
        ? { tone: "text-zinc-400", text: t("statusDisconnected") }
        : status === "failed"
          ? { tone: "text-red-400", text: t("statusFailed") }
          : status === "invalid"
            ? { tone: "text-red-400", text: t("statusInvalid") }
            : status === "notconfigured"
              ? { tone: "text-red-400", text: t("notConfigured") }
              : null;

  return (
    <div className="atlas-subcard rounded-2xl p-6">
      <h3 className="font-semibold text-white">{t("title")}</h3>
      <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>

      {statusMessage && (
        <p className={`mt-3 text-sm ${statusMessage.tone}`}>
          {statusMessage.text}
        </p>
      )}

      {!configured ? (
        <p className="mt-4 text-sm text-zinc-500">{t("notConfigured")}</p>
      ) : connection ? (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <p className="text-zinc-200">
              {t("connectedTo", {
                exchange: exchangeLabel(connection.exchange),
              })}
            </p>
          </div>

          <p className="mt-1 text-xs text-zinc-500">
            {t("connectedSince", {
              date: new Date(connection.createdAt).toLocaleDateString(
                locale,
                { year: "numeric", month: "long", day: "numeric" }
              ),
            })}
          </p>

          <form action={disconnectExchange} className="mt-4">
            <Button type="submit" variant="secondary">
              {t("disconnect")}
            </Button>
          </form>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-300">
              🔒 {t("securityTitle")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-400">
              <li>{t("securityReadOnly")}</li>
              <li>{t("securityEncrypted")}</li>
              <li>{t("securityRevocable")}</li>
            </ul>
            <p className="mt-2 text-xs text-zinc-500">{t("guide")}</p>
          </div>

          <form
            action={connectExchange}
            className="mt-4 space-y-3"
            autoComplete="off"
          >
            <div>
              <label className="text-xs text-zinc-500">
                {t("exchangeLabel")}
              </label>
              <select
                name="exchange"
                defaultValue="binance"
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-600"
              >
                {SUPPORTED_EXCHANGES.map((id) => (
                  <option key={id} value={id}>
                    {EXCHANGE_LABELS[id]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-500">
                {t("apiKey")}
              </label>
              <input
                type="password"
                name="apiKey"
                required
                autoComplete="off"
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500">
                {t("apiSecret")}
              </label>
              <input
                type="password"
                name="secret"
                required
                autoComplete="off"
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-600"
              />
            </div>

            <Button type="submit">{t("connect")}</Button>
          </form>
        </>
      )}
    </div>
  );
}
