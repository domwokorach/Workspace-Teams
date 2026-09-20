import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireCurrentUser, AuthError } from "@/lib/auth/session";
import { exchangeGitHubCode, fetchGitHubViewer, getGitHubRedirectUri } from "@/lib/github/oauth";
import { GITHUB_OAUTH_STATE_COOKIE } from "@/lib/github/oauth-state";
import { encryptSecret } from "@/lib/auth/crypto";
import { prisma } from "@/lib/db/client";

export async function GET(request: Request) {
  let user;
  try {
    user = await requireCurrentUser();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    throw error;
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const settingsUrl = new URL("/settings", request.url);
  settingsUrl.searchParams.set("tab", "github");

  const store = await cookies();
  const expectedState = store.get(GITHUB_OAUTH_STATE_COOKIE)?.value;

  if (errorParam) {
    settingsUrl.searchParams.set("github_error", "denied");
    return NextResponse.redirect(settingsUrl);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    settingsUrl.searchParams.set("github_error", "invalid_state");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const redirectUri = getGitHubRedirectUri();
    const { accessToken, scope } = await exchangeGitHubCode(code, redirectUri);
    const viewer = await fetchGitHubViewer(accessToken);

    await prisma.gitHubConnection.upsert({
      where: { userId: user.id },
      update: {
        githubUserId: BigInt(viewer.id),
        githubUsername: viewer.login,
        accessTokenEncrypted: encryptSecret(accessToken),
        scope,
        connectedAt: new Date(),
      },
      create: {
        userId: user.id,
        githubUserId: BigInt(viewer.id),
        githubUsername: viewer.login,
        accessTokenEncrypted: encryptSecret(accessToken),
        scope,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { githubUsername: viewer.login },
    });

    settingsUrl.searchParams.set("github_connected", "1");
  } catch {
    settingsUrl.searchParams.set("github_error", "exchange_failed");
  }

  const res = NextResponse.redirect(settingsUrl);
  res.cookies.delete(GITHUB_OAUTH_STATE_COOKIE);
  return res;
}
