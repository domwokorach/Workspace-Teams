import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { PullRequestDetail } from "@/components/pull-requests/pull-request-detail";

export default async function PullRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string; number: string }>;
}) {
  const { id, number } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <PullRequestDetail repositoryId={repository.id} number={Number(number)} />
    </div>
  );
}
