"use client";

import { useT } from "@/lib/i18n/use-t";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ErrorState({ title, description }: { title?: string; description?: string }) {
  const t = useT();
  return (
    <Alert variant="destructive">
      <AlertTitle>{title ?? t("shell.somethingWrongTitle")}</AlertTitle>
      {description ? <AlertDescription>{description}</AlertDescription> : null}
    </Alert>
  );
}
