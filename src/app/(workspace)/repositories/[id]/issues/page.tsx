import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { IssueList } from "@/components/issues/issue-list";

export default async function RepositoryIssuesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  return (
    <div className="p-4 md:p-6">
      <IssueList repositoryId={repository.id} currentUserId={user.id} />
    </div>
  );
}
