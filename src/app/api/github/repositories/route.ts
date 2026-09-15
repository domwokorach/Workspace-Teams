import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { searchUserRepositories } from "@/lib/github/repositories";
import { GitHubNotConnectedError, GitHubRateLimitError } from "@/lib/github/client";

export async function GET(request: Request) {
  const user = await requireCurrentUser();
  const { searchParams } = new URL(request.url);

  try {
    const result = await searchUserRepositories(user.id, {
      query: searchParams.get("q") ?? undefined,
      owner: searchParams.get("owner") ?? undefined,
      language: searchParams.get("language") ?? undefined,
      visibility: (searchParams.get("visibility") as "public" | "private" | "all") ?? "all",
      sort: (searchParams.get("sort") as "updated" | "stars" | "forks") ?? "updated",
      page: Number(searchParams.get("page") ?? "1"),
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GitHubNotConnectedError) {
      return NextResponse.json({ error: error.message, code: "not_connected" }, { status: 409 });
    }
    if (error instanceof GitHubRateLimitError) {
      return NextResponse.json(
        { error: error.message, code: "rate_limited", resetAt: error.resetAt },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: "Failed to load repositories." }, { status: 502 });
  }
}
