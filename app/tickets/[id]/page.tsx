"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { HiOutlineArrowRight } from "react-icons/hi";
import ProtectedRoute from "../../components/ProtectedRoute";
import ProfileShell from "../../components/profile/ProfileShell";
import TicketChatThread from "../../components/tickets/TicketChatThread";
import TicketMessageComposer, {
  type TicketComposerPayload,
} from "../../components/tickets/TicketMessageComposer";
import { formatAfghanShamsiDateTime } from "../../lib/date-format";
import { ticketMessagesForDisplay } from "../../lib/ticket-messages";
import {
  closeUserTicket,
  fetchTicket,
  sendTicketMessage,
  ticketStatusBadgeClass,
  ticketStatusLabels,
  type SupportTicket,
} from "../../lib/tickets";

function TicketDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const messages = useMemo(
    () => (ticket ? ticketMessagesForDisplay(ticket) : []),
    [ticket],
  );

  const loadTicket = async (id: number) => {
    const response = await fetchTicket(id);

    if (!response.success || !response.data?.ticket) {
      setError(response.message || "تیکت یافت نشد.");
      setTicket(null);
      return;
    }

    setTicket(response.data.ticket);
    setError("");
  };

  useEffect(() => {
    const id = Number(params.id);
    if (!id) {
      setError("تیکت یافت نشد.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      await loadTicket(id);
      if (!cancelled) {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const handleSendMessage = async (payload: TicketComposerPayload) => {
    if (!ticket) {
      return false;
    }

    setError("");
    setSuccess("");

    const response = await sendTicketMessage(ticket.id, payload);

    if (!response.success || !response.data?.ticket) {
      setError(response.message || "ارسال پیام انجام نشد.");
      return false;
    }

    setTicket(response.data.ticket);
    setSuccess("پیام شما ارسال شد.");
    return true;
  };

  const handleCloseTicket = async () => {
    if (!ticket) {
      return;
    }

    setClosing(true);
    setError("");
    setSuccess("");

    const response = await closeUserTicket(ticket.id);

    setClosing(false);

    if (!response.success || !response.data?.ticket) {
      setError(response.message || "بستن تیکت انجام نشد.");
      return;
    }

    setTicket(response.data.ticket);
    setSuccess("تیکت با موفقیت بسته شد.");
    window.setTimeout(() => router.push("/tickets"), 900);
  };

  const canReply = ticket?.status !== "closed";
  const canClose = ticket?.status === "answered";

  return (
    <ProfileShell active="tickets">
      <Link
        href="/tickets"
        className="mb-5 inline-flex items-center gap-2 text-sm text-[#c8c8c8] transition hover:text-[#f8d977]"
      >
        <HiOutlineArrowRight className="h-4 w-4" />
        بازگشت به لیست تیکت‌ها
      </Link>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-[#f5c518]" />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-rose-100">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-emerald-100">
          {success}
        </div>
      ) : null}

      {ticket ? (
        <article className="flex min-h-[32rem] flex-col rounded-2xl border border-[#f5c518]/20 bg-[#121212]/90 p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#f5c518]/15 pb-4">
            <div>
              <h1 className="text-xl font-black text-[#f8d977] md:text-2xl">{ticket.subject}</h1>
              <p className="mt-1 text-sm text-[#a8a8a8]">{ticket.category_label}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${ticketStatusBadgeClass(ticket.status)}`}
              >
                {ticketStatusLabels[ticket.status]}
              </span>
              <span className="text-xs text-[#8f8f8f]">
                {formatAfghanShamsiDateTime(ticket.created_at)}
              </span>
            </div>
          </div>

          <TicketChatThread messages={messages} className="flex-1" />

          {canReply ? (
            <TicketMessageComposer
              disabled={closing}
              placeholder="ادامه گفتگو با پشتیبانی..."
              onSubmit={handleSendMessage}
            />
          ) : (
            <p className="mt-4 border-t border-white/10 pt-4 text-sm text-[#a8a8a8]">
              این تیکت بسته شده است.
              {ticket.closed_at
                ? ` بسته‌شده در ${formatAfghanShamsiDateTime(ticket.closed_at)}`
                : ""}
            </p>
          )}

          {canClose ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-xs text-[#a8a8a8]">
                اگر مشکل حل شد، می‌توانید تیکت را ببندید.
              </p>
              <button
                type="button"
                disabled={closing}
                onClick={() => void handleCloseTicket()}
                className="rounded-xl border border-slate-400/30 bg-slate-500/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-500/20 disabled:opacity-60"
              >
                {closing ? "در حال بستن..." : "بستن تیکت"}
              </button>
            </div>
          ) : null}
        </article>
      ) : null}
    </ProfileShell>
  );
}

export default function TicketDetailPage() {
  return (
    <ProtectedRoute>
      <TicketDetailContent />
    </ProtectedRoute>
  );
}
