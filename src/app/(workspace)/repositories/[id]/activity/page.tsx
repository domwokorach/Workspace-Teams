import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { prisma } from "@/lib/db/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

const ACTIVITY_LABEL: Record<string, string> = {
  ISSUE_OPENED: "opened an issue",
  ISSUE_CLOSED: "closed an issue",
  PR_OPENED: "opened a pull request",
  PR_MERGED: "merged a pull request",
  PR_CLOSED: "closed a pull request",
  COMMIT_PUSHED: "pushed a commit",
  BUILD_PASSED: "build passed",
  BUILD_FAILED: "build failed",
  CONTRIBUTOR_JOINED: "joined the repository",
  REVIEW_COMPLETED: "completed a review",
};

export default async function RepositoryActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  const activities = await prisma.activity.findMany({
    where: { repositoryId: repository.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: true },
  });

  return (
    <div className="p-4 md:p-6">
      {activities.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <ul className="space-y-4">
          {activities.map((a) => (
            <li key={a.id} className="flex items-start gap-3 text-sm">
              <Avatar className="size-7">
                <AvatarImage src={a.actor?.avatarUrl ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {a.actor ? `${a.actor.firstName[0]}${a.actor.lastName[0]}` : "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p>
                  <span className="font-medium">
                    {a.actor ? `${a.actor.firstName} ${a.actor.lastName}` : "Someone"}
                  </span>{" "}
                  <span className="text-muted-foreground">{ACTIVITY_LABEL[a.type] ?? a.summary}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(a.createdAt, { addSuffix: true })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
