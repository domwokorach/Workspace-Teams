import { Suspense } from "react";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { IssuesWorkspace } from "@/components/issues/issues-workspace";

export default async function RepositoryIssuesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  return (
    <div className="p-4 md:p-6">
      <Suspense>
        <IssuesWorkspace repositoryId={repository.id} currentUserId={user.id} />
      </Suspense>
    </div>
  );
}
