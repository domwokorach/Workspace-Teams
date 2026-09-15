import "server-only";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_URL = "https://api.github.com";

export const GITHUB_OAUTH_SCOPES = ["repo", "read:user", "user:email", "read:org"];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable`);
  return value;
}

export function isGitHubOAuthConfigured(): boolean {
  return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export function buildGitHubAuthorizeUrl(state: string, redirectUri: string): string {
  const clientId = requireEnv("GITHUB_CLIENT_ID");
  const url = new URL(GITHUB_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", GITHUB_OAUTH_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "false");
  return url.toString();
}

interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

export async function exchangeGitHubCode(code: string, redirectUri: string) {
  const clientId = requireEnv("GITHUB_CLIENT_ID");
  const clientSecret = requireEnv("GITHUB_CLIENT_SECRET");

  const res = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = (await res.json()) as GitHubTokenResponse;
  if (!res.ok || data.error || !data.access_token) {
    throw new Error(data.error_description ?? "Failed to exchange GitHub authorization code.");
  }

  return { accessToken: data.access_token, scope: data.scope ?? "" };
}

export async function fetchGitHubViewer(accessToken: string) {
  const res = await fetch(`${GITHUB_API_URL}/user`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("GitHub credentials expired.");
    throw new Error("Failed to load GitHub profile.");
  }
  return (await res.json()) as { id: number; login: string; avatar_url: string; name: string | null };
}

export async function revokeGitHubToken(accessToken: string) {
  const clientId = requireEnv("GITHUB_CLIENT_ID");
  const clientSecret = requireEnv("GITHUB_CLIENT_SECRET");
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  await fetch(`${GITHUB_API_URL}/applications/${clientId}/grant`, {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ access_token: accessToken }),
  }).catch(() => {
    // Best-effort revoke — the local connection record is deleted regardless.
  });
}
