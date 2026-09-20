import { NextResponse } from "next/server";
import { requireCurrentUser, AuthError } from "@/lib/auth/session";
import { buildGitHubAuthorizeUrl, getGitHubRedirectUri, isGitHubOAuthConfigured } from "@/lib/github/oauth";
import { GITHUB_OAUTH_STATE_COOKIE } from "@/lib/github/oauth-state";

export async function GET(request: Request) {
  try {
    await requireCurrentUser();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    throw error;
  }

  if (!isGitHubOAuthConfigured()) {
    const url = new URL("/settings", request.url);
    url.searchParams.set("github_error", "not_configured");
    return NextResponse.redirect(url);
  }

  const state = crypto.randomUUID();
  const redirectUri = getGitHubRedirectUri();
  const authorizeUrl = buildGitHubAuthorizeUrl(state, redirectUri);

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(GITHUB_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return res;
}
