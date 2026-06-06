import { redirect } from "next/navigation";

export default async function MovieDraftRedirectPage({
  params,
}: {
  params: Promise<{ movieId: string }>;
}) {
  const { movieId } = await params;

  redirect(`/admin/content-management/movies/${movieId}/publication`);
}
