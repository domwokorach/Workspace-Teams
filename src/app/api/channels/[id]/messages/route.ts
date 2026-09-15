import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleChannel } from "@/lib/channel";
import { prisma } from "@/lib/db/client";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  await getAccessibleChannel(user.id, id);

  const messages = await prisma.message.findMany({
    where: { channelId: id },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { author: true, reactions: true },
  });

  return NextResponse.json({ messages });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  await getAccessibleChannel(user.id, id);

  const { content } = await request.json();
  if (!content?.trim()) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const message = await prisma.message.create({
    data: { channelId: id, authorId: user.id, content },
    include: { author: true, reactions: true },
  });

  return NextResponse.json({ message });
}
