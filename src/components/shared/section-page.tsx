"use client";

import { useT } from "@/lib/i18n/use-t";

import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";

export function SectionPage({ title, description }: { title: string; description: string }) {
  const t = useT();
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState title={t("shell.foundationTitle")} description={t("shell.foundationDesc")} />
    </div>
  );
}
