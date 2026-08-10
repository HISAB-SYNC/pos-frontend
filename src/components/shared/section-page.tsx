import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";

export function SectionPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState title="Foundation ready" description="This route is scaffolded and ready for feature work." />
    </div>
  );
}
