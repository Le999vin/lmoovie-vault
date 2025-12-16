import { NextResponse } from "next/server";

import { getChatModel } from "@/lib/ai/llm";

export const runtime = "nodejs";

export async function GET() {
  try {
    const model = getChatModel();
    const res = await model.invoke("Sag Hallo in 1 Satz.");
    const text = typeof res.content === "string" ? res.content : JSON.stringify(res.content ?? "");
    return NextResponse.json({ ok: true, text });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
