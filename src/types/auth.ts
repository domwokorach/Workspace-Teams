import type { Role } from "@/generated/prisma/enums";

export interface AuthSession {
  userId: string;
  email: string;
  role: Role;
  sessionId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Credentials {
  email: string;
  password: string;
}
