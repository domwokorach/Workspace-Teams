import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { CodeWorkspace } from "@/components/repository/code-workspace";

export default async function RepositoryCodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  return <CodeWorkspace repositoryId={repository.id} defaultBranch={repository.defaultBranch} />;
}
