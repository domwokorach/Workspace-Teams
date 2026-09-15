import type { Role } from "@/generated/prisma/enums";
import type { UserSummary } from "@/types/user";

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
}

export interface WorkspaceMemberSummary {
  user: UserSummary;
  role: Role;
  joinedAt: string;
}
