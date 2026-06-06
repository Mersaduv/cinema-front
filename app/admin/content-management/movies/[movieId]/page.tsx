import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ movieId: string }>;
};

export default async function AdminMovieDetailRedirectPage({ params }: Props) {
  const { movieId } = await params;
  redirect(`/admin/content-management/movies/${movieId}/publication`);
}
