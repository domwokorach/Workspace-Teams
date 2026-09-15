export type Role = "OWNER" | "ADMIN" | "MAINTAINER" | "DEVELOPER" | "VIEWER";

const ROLE_RANK: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MAINTAINER: 2,
  DEVELOPER: 1,
  VIEWER: 0,
};

/** True if `role` grants at least the privileges of `minimum`. */
export function hasAtLeastRole(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export const can = {
  manageWorkspace: (role: Role) => hasAtLeastRole(role, "ADMIN"),
  manageRepository: (role: Role) => hasAtLeastRole(role, "MAINTAINER"),
  writeIssuesAndPRs: (role: Role) => hasAtLeastRole(role, "DEVELOPER"),
  mergePullRequest: (role: Role) => hasAtLeastRole(role, "MAINTAINER"),
  manageTeamMembers: (role: Role) => hasAtLeastRole(role, "ADMIN"),
  startVideoRoom: (role: Role) => hasAtLeastRole(role, "VIEWER"),
  joinCodingSession: (role: Role) => hasAtLeastRole(role, "VIEWER"),
  editCode: (role: Role) => hasAtLeastRole(role, "DEVELOPER"),
};
