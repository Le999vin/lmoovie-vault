import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { getChatModel } from "@/lib/ai/llm";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

type ClientMessage = { role: "user" | "assistant" | "system"; content: string };

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const messages = (body as { messages?: ClientMessage[] }).messages;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const hasContent = messages.every((m) => typeof m.content === "string" && m.content.trim().length > 0);
    if (!hasContent) {
      return NextResponse.json({ error: "Messages must include non-empty content" }, { status: 400 });
    }

    const model = getChatModel();
    const userInput = messages[messages.length - 1].content;

    const response = await model.invoke(userInput);
    const text =
      typeof response.content === "string" ? response.content : JSON.stringify(response.content ?? "");

    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("Missing env: OPENROUTER_API_KEY") ? 500 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
