import { describe, it, expect } from "vitest";
import { hasAtLeastRole, can } from "@/lib/permissions";

describe("hasAtLeastRole", () => {
  it("ranks OWNER above every other role", () => {
    expect(hasAtLeastRole("OWNER", "ADMIN")).toBe(true);
    expect(hasAtLeastRole("OWNER", "VIEWER")).toBe(true);
  });

  it("does not let a lower role satisfy a higher requirement", () => {
    expect(hasAtLeastRole("VIEWER", "DEVELOPER")).toBe(false);
    expect(hasAtLeastRole("DEVELOPER", "MAINTAINER")).toBe(false);
  });

  it("treats equal roles as satisfying the requirement", () => {
    expect(hasAtLeastRole("MAINTAINER", "MAINTAINER")).toBe(true);
  });
});

describe("can", () => {
  it("only allows merging pull requests for MAINTAINER and above", () => {
    expect(can.mergePullRequest("DEVELOPER")).toBe(false);
    expect(can.mergePullRequest("MAINTAINER")).toBe(true);
    expect(can.mergePullRequest("ADMIN")).toBe(true);
  });

  it("allows VIEWER to join coding sessions but not edit code", () => {
    expect(can.joinCodingSession("VIEWER")).toBe(true);
    expect(can.editCode("VIEWER")).toBe(false);
  });

  it("restricts workspace management to ADMIN and above", () => {
    expect(can.manageWorkspace("MAINTAINER")).toBe(false);
    expect(can.manageWorkspace("ADMIN")).toBe(true);
  });
});
