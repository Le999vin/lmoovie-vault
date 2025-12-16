"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Clipboard, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

export function ChatPanel({ authenticated }: { authenticated: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! Ask me for movie picks, your taste profile, or to update your watchlist.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const parseJsonText = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && "text" in parsed && typeof parsed.text === "string") {
        return parsed.text;
      }
    } catch {
      // ignore
    }
    return raw;
  };

  const sendMessage = async () => {
    if (!input.trim() || !authenticated) return;
    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
        setLoading(false);
        return;
      }

      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = (await res.json()) as { text?: string; error?: string };
        const text = data.text ?? data.error ?? "Sorry, something went wrong.";
        setMessages((prev) => [...prev, { role: "assistant", content: text }]);
      } else {
        const raw = await res.text();
        const text = parseJsonText(raw);
        setMessages((prev) => [...prev, { role: "assistant", content: text }]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="glass fade-border border-white/40 shadow-2xl">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Movie Concierge
        </CardTitle>
        <Badge variant={authenticated ? "secondary" : "muted"}>
          {authenticated ? "Using your vault data" : "Sign in to connect your vault"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[440px] rounded-2xl border border-white/60 bg-white/70 p-4 shadow-inner" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <ChatMessageBubble key={idx} message={message} />
            ))}
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="dot inline-flex h-2 w-2 rounded-full bg-primary" />
                <span className="dot inline-flex h-2 w-2 rounded-full bg-primary/80" style={{ animationDelay: "0.15s" }} />
                <span className="dot inline-flex h-2 w-2 rounded-full bg-primary/60" style={{ animationDelay: "0.3s" }} />
              </div>
            ) : null}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            placeholder={authenticated ? "Ask for a suggestion or update your watchlist..." : "Sign in to chat"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!authenticated || loading}
            className="h-12 rounded-2xl bg-white/90"
          />
          <Button onClick={sendMessage} disabled={!authenticated || loading} className="gap-2 rounded-2xl px-4">
            {loading ? "..." : "Send"}
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const text = message.content;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={cn(
          "relative max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-md",
          isUser
            ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-primary-foreground"
            : "glass border border-white/60 text-foreground",
        )}
      >
        {!isUser ? (
          <button
            type="button"
            onClick={copyToClipboard}
            className="absolute right-2 top-2 rounded p-1 text-muted-foreground transition hover:text-foreground"
            aria-label="Copy message"
          >
            <Clipboard className="h-4 w-4" />
          </button>
        ) : null}
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{text}</div>
        ) : (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                code(props) {
                  const { children, className, ...rest } = props;
                  const isBlock = String(className || "").includes("language-") || String(children).includes("\n");
                  return isBlock ? (
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900/90 p-3 text-xs text-slate-100">
                      <pre className="overflow-auto text-xs">
                        <code className={className} {...rest}>
                          {children}
                        </code>
                      </pre>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(String(children)).catch(() => {})}
                        className="absolute right-2 top-2 rounded bg-white/10 px-2 py-1 text-[10px] uppercase tracking-wide text-white transition hover:bg-white/20"
                      >
                        Copy
                      </button>
                    </div>
                  ) : (
                    <code className={className} {...rest}>
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <p className="leading-relaxed text-foreground/90">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc pl-5">{children}</ul>;
                },
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
