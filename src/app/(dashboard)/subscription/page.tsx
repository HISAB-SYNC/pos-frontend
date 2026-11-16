"use client";

import { useT } from "@/lib/i18n/use-t";
import { SectionPage } from "@/components/shared/section-page";

export default function SubscriptionPage() {
  const t = useT();
  return <SectionPage title={t("settings.subscriptionTitle")} description={t("settings.subscriptionDesc")} />;
}
