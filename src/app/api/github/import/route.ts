import { requireCurrentUser } from "@/lib/auth/session";
import { importRepository } from "@/lib/github/import";

export async function POST(request: Request) {
  const user = await requireCurrentUser();
  const { owner, repo } = await request.json();

  if (!owner || !repo) {
    return new Response(JSON.stringify({ error: "owner and repo are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      try {
        const generator = importRepository(user.id, owner, repo);
        let result = await generator.next();
        while (!result.done) {
          send({ type: "progress", ...result.value });
          result = await generator.next();
        }
        send({ type: "complete", repositoryId: result.value.repositoryId });
      } catch (error) {
        send({ type: "error", message: error instanceof Error ? error.message : "Import failed." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
