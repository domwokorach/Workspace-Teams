import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { WorkflowRunList } from "@/components/tests/workflow-run-list";

export default async function RepositoryTestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  return <WorkflowRunList repositoryId={repository.id} />;
}
