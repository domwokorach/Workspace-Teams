import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireCurrentUser, AuthError } from "@/lib/auth/session";
import { listMessages, createMessage, MessageNotFoundError } from "@/lib/messages/service";
import { listMessagesSchema, createMessageSchema } from "@/lib/validation/messages";

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.code === "UNAUTHENTICATED" ? 401 : 403 });
  }
  if (error instanceof MessageNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await requireCurrentUser();
    const url = new URL(request.url);
    const input = listMessagesSchema.parse({
      channelId: id,
      limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });
    const result = await listMessages(user.id, input);
    return NextResponse.json({ messages: result.items, nextCursor: result.nextCursor });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const input = createMessageSchema.parse({ ...body, channelId: id });
    const message = await createMessage(user.id, input);
    return NextResponse.json({ message });
  } catch (error) {
    return errorResponse(error);
  }
}
