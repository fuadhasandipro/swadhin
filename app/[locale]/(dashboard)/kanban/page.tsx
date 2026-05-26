import { getTranslations } from "next-intl/server";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";

export default async function KanbanPage() {
  const t = await getTranslations("dashboard"); // Or wherever the kanban translations will go. We'll use hardcoded for now or basic labels if needed.

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-slate-800 dark:text-emerald-100">
          Kanban Board
        </h1>
        <p className="text-sm text-slate-500 dark:text-emerald-500/70 mt-1">
          Visual order pipeline management
        </p>
      </div>

      <KanbanBoard />
    </div>
  );
}
