import { TablePageSkeleton } from "@/components/shared/skeletons";

/** Generic page placeholder (header, cards and a table) for pages without their own skeleton. */
export function LoadingState() {
  return <TablePageSkeleton />;
}
