"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { HiOutlineArrowRight } from "react-icons/hi";
import TicketChatThread from "../../../components/tickets/TicketChatThread";
import TicketMessageComposer, {
  type TicketComposerPayload,
} from "../../../components/tickets/TicketMessageComposer";
import { adminApiErrorMessage } from "../../../lib/admin-api";
import {
  fetchAdminTicket,
  updateAdminTicket,
  type AdminSupportTicket,
} from "../../../lib/admin-tickets";
import { formatAfghanShamsiDateTime } from "../../../lib/date-format";
import { ticketMessagesForDisplay } from "../../../lib/ticket-messages";
import {
  ticketStatusBadgeClass,
  ticketStatusLabels,
  type TicketStatus,
} from "../../../lib/tickets";

const ticketStatusChangeOptions: Array<{ value: TicketStatus; label: string }> = [
  { value: "waiting", label: ticketStatusLabels.waiting },
  { value: "answered", label: ticketStatusLabels.answered },
  { value: "closed", label: ticketStatusLabels.closed },
];

export default function AdminTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = Number(params.id);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const { data: ticket, isLoading, mutate, error: swrError } = useSWR(
    Number.isFinite(ticketId) && ticketId > 0 ? `admin-ticket:${ticketId}` : null,
    () => fetchAdminTicket(ticketId),
    { revalidateOnFocus: false },
  );

  const messages = useMemo(
    () => (ticket ? ticketMessagesForDisplay(ticket) : []),
    [ticket],
  );

  const handleAdminMessage = async (payload: TicketComposerPayload, closeAfterReply = false) => {
    if (!ticket) {
      return false;
    }

    setError("");
    setSuccess("");
    setActionLoading(true);

    const response = await updateAdminTicket(ticket.id, {
      admin_reply: payload.body,
      imageDirectory: payload.imageDirectory,
      imageFilename: payload.imageFilename,
      status: closeAfterReply ? "closed" : undefined,
    });

    setActionLoading(false);

    if (!response.success) {
      setError(adminApiErrorMessage(response, "ثبت پاسخ انجام نشد."));
      return false;
    }

    setSuccess(closeAfterReply ? "پاسخ ثبت و تیکت بسته شد." : "پاسخ تیکت ثبت شد.");
    await mutate();
    return true;
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket || ticket.status === status) {
      return;
    }

    setError("");
    setSuccess("");
    setActionLoading(true);

    const response = await updateAdminTicket(ticket.id, { status });

    setActionLoading(false);

    if (!response.success) {
      setError(adminApiErrorMessage(response, "تغییر وضعیت انجام نشد."));
      return;
    }

    setSuccess("وضعیت تیکت به‌روزرسانی شد.");
    await mutate();
  };

  if (!Number.isFinite(ticketId) || ticketId <= 0) {
    return (
      <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
        تیکت یافت نشد.
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <Link
        href="/admin/tickets"
        className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-[#f8d977]"
      >
        <HiOutlineArrowRight className="h-4 w-4" />
        بازگشت به لیست تیکت‌ها
      </Link>

      {isLoading ? <p className="text-white/50">در حال بارگذاری...</p> : null}

      {swrError ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {swrError instanceof Error ? swrError.message : "دریافت تیکت انجام نشد."}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      {ticket ? (
        <TicketChatPanel
          ticket={ticket}
          messages={messages}
          actionLoading={actionLoading}
          onStatusChange={handleStatusChange}
          onAdminMessage={handleAdminMessage}
        />
      ) : null}
    </div>
  );
}

function TicketChatPanel({
  ticket,
  messages,
  actionLoading,
  onStatusChange,
  onAdminMessage,
}: {
  ticket: AdminSupportTicket;
  messages: ReturnType<typeof ticketMessagesForDisplay>;
  actionLoading: boolean;
  onStatusChange: (status: TicketStatus) => Promise<void>;
  onAdminMessage: (payload: TicketComposerPayload, closeAfterReply?: boolean) => Promise<boolean>;
}) {
  const isClosed = ticket.status === "closed";

  return (
    <article className="flex min-h-[32rem] flex-col rounded-[24px] border border-white/10 bg-white/[0.02] p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-black text-white md:text-2xl">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-white/50">
            {ticket.user?.name} — {ticket.user?.email} — {ticket.category_label}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${ticketStatusBadgeClass(ticket.status)}`}
          >
            {ticketStatusLabels[ticket.status]}
          </span>
          <select
            value={ticket.status}
            disabled={actionLoading}
            onChange={(event) => void onStatusChange(event.target.value as TicketStatus)}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white outline-none"
          >
            {ticketStatusChangeOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#121212]">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TicketChatThread messages={messages} className="flex-1" />

      {!isClosed ? (
        <div className="space-y-3">
          <TicketMessageComposer
            disabled={actionLoading}
            placeholder="پاسخ پشتیبانی..."
            submitLabel="ارسال پاسخ"
            secondaryLabel="ثبت پاسخ و بستن"
            onSubmit={(payload) => onAdminMessage(payload, false)}
            onSecondarySubmit={(payload) => onAdminMessage(payload, true)}
          />
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => void onStatusChange("closed")}
            className="rounded-2xl border border-slate-400/30 bg-slate-500/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-500/20 disabled:opacity-60"
          >
            بستن تیکت
          </button>
        </div>
      ) : (
        <p className="mt-4 border-t border-white/10 pt-4 text-sm text-white/45">
          تیکت بسته شده
          {ticket.closed_at ? ` — ${formatAfghanShamsiDateTime(ticket.closed_at)}` : ""}
        </p>
      )}
    </article>
  );
}
