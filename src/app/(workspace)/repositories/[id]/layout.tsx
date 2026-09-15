import { notFound, redirect } from "next/navigation";
import { requireCurrentUser, AuthError } from "@/lib/auth/session";
import { getAccessibleRepository } from "@/lib/repository";
import { RepositoryHeader } from "@/components/repository/repository-header";

export default async function RepositoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCurrentUser();

  let repository;
  try {
    repository = await getAccessibleRepository(user.id, id);
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.code === "FORBIDDEN") notFound();
      redirect("/login");
    }
    throw error;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <RepositoryHeader repository={repository} />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
