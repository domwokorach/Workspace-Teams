import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const DEMO_PASSWORD = "Password123!";

const USERS = [
  { firstName: "Alex", lastName: "Morgan", email: "alex@acme.dev", github: "alexmorgan", role: "OWNER" as const },
  { firstName: "Jamie", lastName: "Lee", email: "jamie@acme.dev", github: "jamielee", role: "ADMIN" as const },
  { firstName: "Morgan", lastName: "Chen", email: "morgan@acme.dev", github: "morganchen", role: "MAINTAINER" as const },
  { firstName: "Priya", lastName: "Nair", email: "priya@acme.dev", github: "priyanair", role: "DEVELOPER" as const },
  { firstName: "Sam", lastName: "Okafor", email: "sam@acme.dev", github: "samokafor", role: "DEVELOPER" as const },
  { firstName: "Taylor", lastName: "Reyes", email: "taylor@acme.dev", github: "taylorreyes", role: "DEVELOPER" as const },
  { firstName: "Devon", lastName: "Wu", email: "devon@acme.dev", github: "devonwu", role: "VIEWER" as const },
  { firstName: "Sarah", lastName: "Kim", email: "sarah@acme.dev", github: "sarahkim", role: "DEVELOPER" as const },
];

const REPOS = [
  {
    name: "api-server",
    description: "Core REST/GraphQL API powering the platform — auth, billing, and workspace services.",
    language: "TypeScript",
    isPrivate: true,
  },
  {
    name: "web-app",
    description: "Customer-facing Next.js application and design system.",
    language: "TypeScript",
    isPrivate: false,
  },
  {
    name: "infra",
    description: "Terraform modules and Kubernetes manifests for staging and production.",
    language: "HCL",
    isPrivate: true,
  },
];

const CHANNELS = [
  { name: "general", topic: "Company-wide announcements and work-based matters", kind: "PUBLIC" as const },
  { name: "engineering", topic: "Cross-team engineering discussion", kind: "PUBLIC" as const },
  { name: "frontend", topic: "web-app and design system", kind: "PUBLIC" as const },
  { name: "backend", topic: "api-server discussion", kind: "PUBLIC" as const },
  { name: "devops", topic: "Infrastructure, deploys, and incidents", kind: "PUBLIC" as const },
  { name: "code-review", topic: "PR review requests and pairing", kind: "PUBLIC" as const },
];

const ISSUE_TITLES = [
  "Fix authentication refresh token race condition",
  "Add rate limiting to public API endpoints",
  "Investigate memory leak in WebSocket connection pool",
  "Support keyboard navigation in command palette",
  "Improve error messages for failed GitHub imports",
  "Add pagination to contributor stats endpoint",
  "Dark mode contrast issues in diff viewer",
  "Flaky test: repository import SSE stream",
  "Add CSV export for issue reports",
  "Reduce cold start time on Vercel Functions",
  "Support SSO login for enterprise workspaces",
  "Monaco editor loses cursor position on file switch",
  "Add webhook support for external CI providers",
  "Improve mobile layout for pull request diff view",
  "Add bulk label management for issues",
  "Fix timezone handling in activity feed timestamps",
  "Add audit log for workspace admin actions",
  "Support GitHub Enterprise Server imports",
  "Optimize file tree loading for large monorepos",
  "Add retry logic for GitHub API rate limits",
];

const PR_TITLES = [
  "Add realtime collaboration for coding sessions",
  "Implement refresh-token rotation",
  "Add contributor commit-activity chart",
  "Migrate to Prisma 7 driver adapters",
  "Add CI status badges to repository cards",
  "Improve Monaco editor language detection",
  "Add workspace member role management UI",
  "Fix diff viewer word-wrap on long lines",
  "Add GitHub Actions workflow re-run support",
  "Optimize dashboard query performance",
];

const COMMIT_MESSAGES = [
  "Fix refresh token concurrency issue",
  "Add integration tests for GitHub import flow",
  "Refactor permission checks into shared module",
  "Update dependencies to latest minor versions",
  "Improve error boundary for editor crashes",
  "Add loading skeletons to dashboard cards",
  "Fix off-by-one error in pagination",
  "Add rate limiter for auth endpoints",
  "Clean up unused imports across components",
  "Add e2e test for pull request merge flow",
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const users = [];
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        passwordHash,
        githubUsername: u.github,
        role: u.role,
        status: "ONLINE",
      },
    });
    users.push(user);
  }

  const workspace = await prisma.workspace.upsert({
    where: { slug: "acme-engineering" },
    update: {},
    create: {
      name: "Acme Engineering",
      slug: "acme-engineering",
      members: {
        create: users.map((u, i) => ({ userId: u.id, role: USERS[i].role })),
      },
    },
  });

  const channels = [];
  for (const c of CHANNELS) {
    const channel = await prisma.channel.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name: c.name } },
      update: {},
      create: {
        workspaceId: workspace.id,
        name: c.name,
        topic: c.topic,
        kind: c.kind,
        members: { create: users.map((u) => ({ userId: u.id })) },
      },
    });
    channels.push(channel);
  }

  const repos = [];
  for (const r of REPOS) {
    const repo = await prisma.repository.upsert({
      where: { fullName: `acme-org/${r.name}` },
      update: {},
      create: {
        workspaceId: workspace.id,
        name: r.name,
        owner: "acme-org",
        fullName: `acme-org/${r.name}`,
        description: r.description,
        language: r.language,
        isPrivate: r.isPrivate,
        defaultBranch: "main",
        stars: Math.floor(Math.random() * 500),
        forks: Math.floor(Math.random() * 80),
        openIssuesCount: 0,
        githubUrl: `https://github.com/acme-org/${r.name}`,
        cloneUrlHttps: `https://github.com/acme-org/${r.name}.git`,
        cloneUrlSsh: `git@github.com:acme-org/${r.name}.git`,
        lastSyncedAt: new Date(),
        members: { create: users.map((u) => ({ userId: u.id, role: "DEVELOPER" })) },
        branches: {
          create: [
            { name: "main", isDefault: true, headSha: "a1b2c3d" },
            { name: "develop", isDefault: false, headSha: "e4f5g6h" },
          ],
        },
      },
    });
    repos.push(repo);
  }

  // Commits
  let commitIndex = 0;
  for (let i = 0; i < 25; i++) {
    const repo = pick(repos, i);
    const author = pick(users, i);
    await prisma.commit.upsert({
      where: { repositoryId_sha: { repositoryId: repo.id, sha: `seed${commitIndex.toString().padStart(6, "0")}` } },
      update: {},
      create: {
        repositoryId: repo.id,
        sha: `seed${commitIndex.toString().padStart(6, "0")}`,
        message: pick(COMMIT_MESSAGES, i),
        authorName: `${author.firstName} ${author.lastName}`,
        authorEmail: author.email,
        authorAvatar: author.avatarUrl,
        branch: "main",
        additions: 5 + (i % 40),
        deletions: i % 15,
        committedAt: daysAgo(25 - i),
      },
    });
    commitIndex++;
  }

  // Issues
  for (let i = 0; i < 20; i++) {
    const repo = pick(repos, i);
    const author = pick(users, i);
    const assignee = pick(users, i + 1);
    const isClosed = i % 3 === 0;
    await prisma.issue.upsert({
      where: { repositoryId_number: { repositoryId: repo.id, number: i + 1 } },
      update: {},
      create: {
        repositoryId: repo.id,
        number: i + 1,
        title: pick(ISSUE_TITLES, i),
        description: `Details for "${pick(ISSUE_TITLES, i)}". Reported during sprint review.`,
        state: isClosed ? "CLOSED" : "OPEN",
        labels: [pick(["bug", "enhancement", "authentication", "performance", "ci"], i), pick(["frontend", "backend", "infra"], i + 1)],
        authorId: author.id,
        assignees: { connect: [{ id: assignee.id }] },
        commentsCount: i % 12,
        createdAt: daysAgo(40 - i),
        closedAt: isClosed ? daysAgo(10 - (i % 10)) : null,
      },
    });
  }
  for (const repo of repos) {
    const openCount = await prisma.issue.count({ where: { repositoryId: repo.id, state: "OPEN" } });
    await prisma.repository.update({ where: { id: repo.id }, data: { openIssuesCount: openCount } });
  }

  // Pull requests
  for (let i = 0; i < 10; i++) {
    const repo = pick(repos, i);
    const author = pick(users, i);
    const isMerged = i % 3 !== 0;
    const state = isMerged ? "MERGED" : i % 5 === 0 ? "DRAFT" : "OPEN";
    const pr = await prisma.pullRequest.upsert({
      where: { repositoryId_number: { repositoryId: repo.id, number: i + 1 } },
      update: {},
      create: {
        repositoryId: repo.id,
        number: i + 1,
        title: pick(PR_TITLES, i),
        description: `Implements "${pick(PR_TITLES, i)}". See linked issue for context.`,
        sourceBranch: `feature/${pick(PR_TITLES, i).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}`,
        targetBranch: "main",
        state,
        authorId: author.id,
        additions: 40 + i * 12,
        deletions: 5 + i * 3,
        changedFiles: 3 + (i % 10),
        commentsCount: i % 8,
        checksStatus: i % 4 === 0 ? "FAILED" : "PASSED",
        reviewers: { connect: [{ id: pick(users, i + 2).id }] },
        createdAt: daysAgo(20 - i),
        mergedAt: state === "MERGED" ? daysAgo(5 - (i % 5)) : null,
      },
    });

    if (state !== "DRAFT") {
      await prisma.pullRequestReview.create({
        data: {
          pullRequestId: pr.id,
          reviewerId: pick(users, i + 2).id,
          state: state === "MERGED" ? "APPROVED" : i % 2 === 0 ? "APPROVED" : "CHANGES_REQUESTED",
          body: state === "MERGED" ? "LGTM, nice work!" : "A couple of small comments inline.",
        },
      });
    }
  }

  // Messages
  const messageBodies = [
    "Morning! Deploy to staging went smoothly overnight.",
    "Anyone else seeing flaky tests on the import SSE stream?",
    "Pushed a fix for the refresh token race condition, would appreciate a review.",
    "```ts\nconst user = await authenticate(token);\n```\nThis is the pattern we should standardize on.",
    "Heads up — rotating the GitHub OAuth client secret this afternoon.",
    "Great sprint review everyone, on track for the release.",
    "Can someone take a look at #7? It's blocking the mobile release.",
    "Added a commit-activity chart to the contributors tab, feedback welcome.",
  ];
  for (const channel of channels) {
    for (let i = 0; i < 8; i++) {
      const author = pick(users, i);
      await prisma.message.create({
        data: {
          channelId: channel.id,
          authorId: author.id,
          content: pick(messageBodies, i + channels.indexOf(channel)),
          createdAt: daysAgo(7 - (i % 7)),
        },
      });
    }
  }

  // Test runs
  for (const repo of repos) {
    for (let i = 0; i < 4; i++) {
      const status = i === 0 ? "FAILED" : "PASSED";
      const run = await prisma.testRun.create({
        data: {
          repositoryId: repo.id,
          workflow: "CI",
          branch: "main",
          commitSha: `seed${(i + 1).toString().padStart(6, "0")}`,
          environment: "node20",
          status,
          durationMs: 45000 + i * 5000,
          startedAt: daysAgo(4 - i),
          finishedAt: daysAgo(4 - i),
        },
      });
      const suiteNames = ["Authentication API", "Repository Import", "GitHub OAuth", "Message Delivery", "Pull Request API"];
      for (const [idx, suite] of suiteNames.entries()) {
        await prisma.testResult.create({
          data: {
            testRunId: run.id,
            suite,
            name: `${suite} suite`,
            status: status === "FAILED" && idx === 0 ? "FAILED" : "PASSED",
            durationMs: 1200 + idx * 300,
            errorMessage: status === "FAILED" && idx === 0 ? "Expected: 200\nReceived: 500" : null,
          },
        });
      }
    }
  }

  // Notifications for the primary demo user
  const primary = users[0];
  const notifTypes: { type: "MESSAGE" | "MENTION" | "PR_APPROVED" | "TEST_FAILED" | "ISSUE_ASSIGNED"; title: string }[] = [
    { type: "MENTION", title: "Jamie Lee mentioned you in #code-review" },
    { type: "PR_APPROVED", title: "Your pull request #3 was approved" },
    { type: "TEST_FAILED", title: "CI failed on api-server (main)" },
    { type: "ISSUE_ASSIGNED", title: "You were assigned to issue #5" },
    { type: "MESSAGE", title: "New message in #engineering" },
  ];
  for (const [i, n] of notifTypes.entries()) {
    await prisma.notification.create({
      data: {
        userId: primary.id,
        workspaceId: workspace.id,
        type: n.type,
        title: n.title,
        readAt: i < 2 ? daysAgo(1) : null,
        createdAt: daysAgo(i),
      },
    });
  }

  // Activity feed
  const activityData: { type: "PR_MERGED" | "ISSUE_OPENED" | "BUILD_FAILED" | "CONTRIBUTOR_JOINED" | "COMMIT_PUSHED"; summary: string }[] = [
    { type: "PR_MERGED", summary: "Merged pull request into main" },
    { type: "ISSUE_OPENED", summary: "Opened a new issue" },
    { type: "BUILD_FAILED", summary: "Build failed on main" },
    { type: "CONTRIBUTOR_JOINED", summary: "Joined the repository" },
    { type: "COMMIT_PUSHED", summary: "Pushed a commit" },
  ];
  for (let i = 0; i < 12; i++) {
    const repo = pick(repos, i);
    const actor = pick(users, i);
    const a = pick(activityData, i);
    await prisma.activity.create({
      data: {
        workspaceId: workspace.id,
        repositoryId: repo.id,
        actorId: actor.id,
        type: a.type,
        summary: a.summary,
        createdAt: daysAgo(12 - i),
      },
    });
  }

  console.log("Seed complete.");
  console.log(`Demo login: ${USERS[0].email} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
