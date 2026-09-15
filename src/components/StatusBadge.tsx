import { STATUS_CLASSES, STATUS_LABEL, type IdeiaStatus } from "@/lib/ideias";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: IdeiaStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
