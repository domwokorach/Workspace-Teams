import "server-only";
import { Octokit } from "@octokit/rest";
import { graphql } from "@octokit/graphql";
import { prisma } from "@/lib/db/client";
import { decryptSecret } from "@/lib/auth/crypto";

export class GitHubNotConnectedError extends Error {
  constructor() {
    super("GitHub account is not connected.");
  }
}

export class GitHubRateLimitError extends Error {
  resetAt: Date;
  constructor(resetAt: Date) {
    super(`GitHub API rate limit exceeded. Resets at ${resetAt.toISOString()}.`);
    this.resetAt = resetAt;
  }
}

/** Resolves a user's decrypted GitHub access token, or null if not connected. */
export async function getGitHubToken(userId: string): Promise<string | null> {
  const connection = await prisma.gitHubConnection.findUnique({
    where: { userId },
  });
  if (!connection) return null;
  return decryptSecret(connection.accessTokenEncrypted);
}

/** Builds an Octokit REST client authenticated as the given user. Throws if not connected. */
export async function getOctokit(userId: string): Promise<Octokit> {
  const token = await getGitHubToken(userId);
  if (!token) throw new GitHubNotConnectedError();
  return new Octokit({ auth: token });
}

/** Builds an authenticated GraphQL client for the given user. Throws if not connected. */
export async function getGitHubGraphQL(userId: string) {
  const token = await getGitHubToken(userId);
  if (!token) throw new GitHubNotConnectedError();
  return graphql.defaults({
    headers: { authorization: `token ${token}` },
  });
}

/** Wraps a GitHub API call, translating rate-limit responses into a typed error. */
export async function withGitHubErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isOctokitError(error) && error.status === 403) {
      const reset = error.response?.headers?.["x-ratelimit-remaining"] === "0"
        ? error.response.headers["x-ratelimit-reset"]
        : undefined;
      if (reset) {
        throw new GitHubRateLimitError(new Date(Number(reset) * 1000));
      }
    }
    throw error;
  }
}

interface OctokitLikeError {
  status: number;
  response?: { headers?: Record<string, string> };
}

function isOctokitError(error: unknown): error is OctokitLikeError {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  );
}
