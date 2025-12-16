import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { createCollection, deleteCollection, renameCollection } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = (body.name as string | undefined)?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const collection = await createCollection(session.user.id, name);
    return NextResponse.json({ ok: true, collection });
  } catch (error) {
    console.error("Collection creation failed", error);
    return NextResponse.json({ error: "Could not create collection" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const id = body.id as string | undefined;
  const name = (body.name as string | undefined)?.trim();

  if (!id || !name) {
    return NextResponse.json({ error: "Missing id or name" }, { status: 400 });
  }

  await renameCollection(session.user.id, id, name);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const id = body.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await deleteCollection(session.user.id, id);
  return NextResponse.json({ ok: true });
}
