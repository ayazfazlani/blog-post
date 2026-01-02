import { getPages } from "@/app/actions/dashboard/pages/page-actions";
import PagesTableClient from "./components/pages-table-client";

export const revalidate = 0;

export default async function PagesPage() {
  const pages = await getPages();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground">
            Manage your static pages and content
          </p>
        </div>
      </div>

      <PagesTableClient initialPages={pages} />
    </div>
  );
}

