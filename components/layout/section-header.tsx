import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  eyebrow?: string;
};

export function SectionHeader({ title, description, action, className, eyebrow }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="space-y-1.5">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-500">{eyebrow}</p> : null}
        <h2 className="text-2xl font-semibold">{title}</h2>
        {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}
