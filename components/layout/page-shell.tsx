import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className="relative min-h-screen bg-noise">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-1/2 top-[-120px] h-80 w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-200/50 via-cyan-200/40 to-transparent blur-3xl" />
        <div className="absolute right-[-120px] top-32 h-72 w-72 rounded-full bg-gradient-to-br from-cyan-200/40 via-white/10 to-transparent blur-2xl" />
      </div>
      <div className={cn("relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8", className)}>{children}</div>
    </div>
  );
}
