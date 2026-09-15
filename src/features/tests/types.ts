import type { TestStatus } from "@/generated/prisma/enums";

export interface TestRunSummary {
  id: string;
  workflow: string;
  branch: string;
  commitSha: string;
  status: TestStatus;
  durationMs: number | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface TestResultSummary {
  id: string;
  suite: string;
  name: string;
  status: TestStatus;
  durationMs: number | null;
  errorMessage: string | null;
}
