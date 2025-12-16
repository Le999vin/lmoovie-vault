import { PageShell } from "@/components/layout/page-shell";
import { PageTransition } from "@/components/layout/page-transition";
import { SiteHeader } from "@/components/layout/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell className="pt-2">
      <SiteHeader />
      <PageTransition>
        <main className="space-y-10">{children}</main>
      </PageTransition>
    </PageShell>
  );
}
