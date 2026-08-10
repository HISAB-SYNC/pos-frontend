import { Button } from "@/components/ui/button";

export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">{description}</p>
      {actionLabel && onAction ? <Button className="mt-4" onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}
