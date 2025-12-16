import { Lightbulb, MessageCircle, ShieldCheck } from "lucide-react";

import { ChatPanel } from "@/components/ai/chat-panel";
import { SectionHeader } from "@/components/layout/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";

export default async function AIPage() {
  const session = await getAuthSession();

  return (
    <div className="space-y-8">
      <SectionHeader
        title="AI Assistant"
        description="A LangChain tool-calling agent that can search your vault, update your watchlist, set ratings, and add notes."
        action={<Badge variant="secondary">Streaming-like responses</Badge>}
        eyebrow="Concierge"
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr,0.8fr]">
        <ChatPanel authenticated={Boolean(session?.user)} />
        <Card className="glass fade-border border-white/50 shadow-xl">
          <CardHeader className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle>Try asking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-2 list-disc list-inside">
              <li>Add Dune to my watchlist as planned.</li>
              <li>Set my rating for Fight Club to 9 and tell me my top genres.</li>
              <li>Suggest tonight under 120 minutes, avoid horror, with a light mood.</li>
              <li>Save a note for Pulp Fiction: the diner intro foreshadows everything.</li>
            </ul>
            <div className="rounded-2xl border border-dashed border-blue-100 bg-blue-50/60 p-3 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                Assistant behavior
              </div>
              <p className="mt-1 leading-relaxed">
                Uses TMDB for metadata, Drizzle/Postgres for your vault, and runs via OpenRouter (server-side only). Your API
                key and tokens never reach the client.
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure by default
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
