"use client";

import useSWR from "swr";
import { fetchUserTicketsSummary } from "../lib/tickets";
import { getCachedMyReviews } from "../lib/reviews";
import { watchlistCount } from "../lib/watchlist";

type ProfileSummary = {
  savedCount: number;
  commentsCount: number;
  ticketWaiting: number;
  ticketAnswered: number;
  ticketClosed: number;
};

const EMPTY_SUMMARY: ProfileSummary = {
  savedCount: 0,
  commentsCount: 0,
  ticketWaiting: 0,
  ticketAnswered: 0,
  ticketClosed: 0,
};

async function fetchProfileSummary(userId: number): Promise<ProfileSummary> {
  const savedCount = watchlistCount(userId);
  const commentsCount = getCachedMyReviews().length;

  const ticketResponse = await fetchUserTicketsSummary();
  if (!ticketResponse.success || !ticketResponse.data) {
    return {
      ...EMPTY_SUMMARY,
      savedCount,
      commentsCount,
    };
  }

  return {
    savedCount,
    commentsCount,
    ticketWaiting: ticketResponse.data.waiting,
    ticketAnswered: ticketResponse.data.answered,
    ticketClosed: ticketResponse.data.closed,
  };
}

export function useProfileSummary(userId?: number) {
  const key = userId ? `profile:summary:${userId}` : null;

  const swr = useSWR(
    key,
    () => fetchProfileSummary(userId as number),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10_000,
      keepPreviousData: true,
    },
  );

  return {
    summary: swr.data ?? EMPTY_SUMMARY,
    loading: Boolean(userId) && !swr.data && swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  };
}
