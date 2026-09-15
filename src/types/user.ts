import type { Role, UserStatus } from "@/generated/prisma/enums";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  githubUsername: string | null;
  role: Role;
  timezone: string;
  status: UserStatus;
}

export type UserSummary = Pick<
  UserProfile,
  "id" | "firstName" | "lastName" | "avatarUrl" | "status"
>;
