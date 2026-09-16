import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { RepositoryContributors } from "@/components/repository/repository-contributors";

export default async function RepositoryContributorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  return <RepositoryContributors repositoryId={repository.id} />;
}
