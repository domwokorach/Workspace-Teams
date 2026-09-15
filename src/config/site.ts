export const SITE_CONFIG = {
  name: "Engineering Workspace",
  description:
    "A unified workspace for team messaging, GitHub repositories, code review, CI, and collaboration.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export const MAX_MESSAGE_LENGTH = 4000;
export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL_DAYS = 30;
export const DEFAULT_BRANCH = "main";
