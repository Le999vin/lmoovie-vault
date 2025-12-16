import { cn } from "@/lib/utils";

type StatPillProps = {
  label: string;
  icon?: React.ReactNode;
  className?: string;
};

export function StatPill({ label, icon, className }: StatPillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-black/5",
        className,
      )}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
