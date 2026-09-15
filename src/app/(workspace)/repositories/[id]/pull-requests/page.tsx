import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { PullRequestList } from "@/components/pull-requests/pull-request-list";

export default async function RepositoryPullRequestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  return (
    <div className="p-4 md:p-6">
      <PullRequestList repositoryId={repository.id} />
    </div>
  );
}
