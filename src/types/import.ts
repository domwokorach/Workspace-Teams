export type ImportStage =
  | "authenticating"
  | "fetching_repository"
  | "loading_branches"
  | "loading_files"
  | "loading_issues"
  | "loading_pull_requests"
  | "loading_contributors"
  | "loading_ci"
  | "ready";

export interface ImportProgressEvent {
  stage: ImportStage;
  message: string;
}
