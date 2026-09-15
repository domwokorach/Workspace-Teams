import { requireCurrentUser } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { IssueDetail } from "@/components/issues/issue-detail";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string; number: string }>;
}) {
  const { id, number } = await params;
  const user = await requireCurrentUser();
  const repository = await getAccessibleRepository(user.id, id);

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <IssueDetail repositoryId={repository.id} number={Number(number)} />
    </div>
  );
}
