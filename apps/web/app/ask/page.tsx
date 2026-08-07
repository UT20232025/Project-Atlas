import { getTranslations } from "next-intl/server";

import AskAtlas from "@/components/chat/AskAtlas";
import AppLayout from "@/components/layout/AppLayout";
import ProUpsell from "@/components/ui/ProUpsell";
import Section from "@/components/ui/Section";
import {
  getCurrentUser,
  hasActiveSubscription,
} from "@/lib/subscription/requirePro";

export default async function AskPage() {
  const user = await getCurrentUser();
  const isPro = hasActiveSubscription(user);
  const t = await getTranslations("AskAtlas");

  return (
    <AppLayout userEmail={user.email} isPro={isPro}>
      {isPro ? (
        <Section title={t("title")} subtitle={t("subtitle")}>
          <AskAtlas />
        </Section>
      ) : (
        <ProUpsell
          title={t("title")}
          subtitle={t("subtitle")}
          heading={t("lockedHeading")}
          description={t("lockedBody")}
          buttonLabel={t("unlockButton")}
          emoji="🧭"
        />
      )}
    </AppLayout>
  );
}
