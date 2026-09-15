import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getDefaultWorkspace } from "@/lib/workspace";

export async function GET(request: Request) {
  const user = await requireCurrentUser();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) return NextResponse.json({ results: [] });

  const workspace = await getDefaultWorkspace(user.id).catch(() => null);
  if (!workspace) return NextResponse.json({ results: [] });

  const [repos, issues, prs, contributors] = await Promise.all([
    prisma.repository.findMany({
      where: { workspaceId: workspace.id, name: { contains: q, mode: "insensitive" } },
      take: 5,
    }),
    prisma.issue.findMany({
      where: { repository: { workspaceId: workspace.id }, title: { contains: q, mode: "insensitive" } },
      take: 5,
      include: { repository: true },
    }),
    prisma.pullRequest.findMany({
      where: { repository: { workspaceId: workspace.id }, title: { contains: q, mode: "insensitive" } },
      take: 5,
      include: { repository: true },
    }),
    prisma.workspaceMember.findMany({
      where: {
        workspaceId: workspace.id,
        user: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
          ],
        },
      },
      take: 5,
      include: { user: true },
    }),
  ]);

  const results = [
    ...repos.map((r) => ({
      type: "repository",
      id: r.id,
      title: r.name,
      subtitle: r.owner,
      href: `/repositories/${r.id}`,
    })),
    ...issues.map((i) => ({
      type: "issue",
      id: i.id,
      title: i.title,
      subtitle: `#${i.number} · ${i.repository.name}`,
      href: `/repositories/${i.repositoryId}/issues/${i.number}`,
    })),
    ...prs.map((p) => ({
      type: "pull_request",
      id: p.id,
      title: p.title,
      subtitle: `#${p.number} · ${p.repository.name}`,
      href: `/repositories/${p.repositoryId}/pull-requests/${p.number}`,
    })),
    ...contributors.map((m) => ({
      type: "contributor",
      id: m.userId,
      title: `${m.user.firstName} ${m.user.lastName}`,
      subtitle: m.user.email,
      href: `/contributors`,
    })),
  ];

  return NextResponse.json({ results });
}
