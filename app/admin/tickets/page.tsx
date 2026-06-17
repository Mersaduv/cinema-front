"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { HiOutlineChevronLeft, HiOutlineSearch } from "react-icons/hi";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminSelect from "../../components/admin/AdminSelect";
import { fetchAdminTickets, type AdminSupportTicket } from "../../lib/admin-tickets";
import { formatAfghanShamsiDateTime } from "../../lib/date-format";
import { ticketListPreview } from "../../lib/ticket-messages";
import {
  ticketStatusBadgeClass,
  ticketStatusLabels,
  type TicketStatus,
} from "../../lib/tickets";

const statusOptions: Array<{ value: TicketStatus | ""; label: string }> = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "waiting", label: ticketStatusLabels.waiting },
  { value: "answered", label: ticketStatusLabels.answered },
  { value: "closed", label: ticketStatusLabels.closed },
];

export default function AdminTicketsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const listKey = useMemo(() => {
    const query = new URLSearchParams();
    query.set("page", String(page));
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (statusFilter) query.set("status", statusFilter);
    return `admin-tickets:${query.toString()}`;
  }, [page, debouncedSearch, statusFilter]);

  const { data, isLoading, error: swrError } = useSWR(
    listKey,
    () =>
      fetchAdminTickets({
        page,
        search: debouncedSearch,
        status: statusFilter || undefined,
      }),
    { revalidateOnFocus: false },
  );

  const tickets = data?.tickets ?? [];
  const pagination = data?.pagination ?? {
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-white">تیکت‌ها</h1>
        <p className="mt-2 text-sm text-white/55">
          لیست تیکت‌های پشتیبانی — برای مشاهده گفتگو روی هر تیکت کلیک کنید
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="relative block">
          <HiOutlineSearch className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => {
              setPage(1);
              setSearchInput(event.target.value);
            }}
            placeholder="جستجو..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-4 pr-12 text-white outline-none focus:border-[#f5c518]/40"
          />
        </label>
        <AdminSelect
          value={statusFilter}
          onChange={(value) => {
            setPage(1);
            setStatusFilter(value as TicketStatus | "");
          }}
          options={statusOptions}
        />
      </div>

      {swrError ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {swrError instanceof Error ? swrError.message : "دریافت تیکت‌ها انجام نشد."}
        </div>
      ) : null}

      <div className="space-y-3">
        {isLoading ? <p className="text-white/50">در حال بارگذاری...</p> : null}
        {!isLoading && tickets.length === 0 ? (
          <p className="text-white/50">تیکتی یافت نشد.</p>
        ) : null}

        {tickets.map((ticket) => (
          <TicketListRow key={ticket.id} ticket={ticket} />
        ))}
      </div>

      <AdminPagination
        pagination={{
          current_page: pagination.current_page,
          last_page: pagination.last_page,
          per_page: pagination.per_page,
          total: pagination.total,
        }}
        onPageChange={setPage}
      />
    </div>
  );
}

function TicketListRow({ ticket }: { ticket: AdminSupportTicket }) {
  const preview = ticketListPreview(ticket);
  const activityAt = ticket.last_message_at ?? ticket.created_at;

  return (
    <Link
      href={`/admin/tickets/${ticket.id}`}
      className="group block rounded-[24px] border border-white/10 bg-white/[0.02] p-5 transition hover:border-[#f5c518]/30 hover:bg-white/[0.04]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${ticketStatusBadgeClass(ticket.status)}`}
            >
              {ticketStatusLabels[ticket.status]}
            </span>
            <span className="text-xs text-white/45">
              {formatAfghanShamsiDateTime(activityAt)}
            </span>
            {ticket.message_count && ticket.message_count > 0 ? (
              <span className="text-xs text-white/35">{ticket.message_count} پیام</span>
            ) : null}
          </div>
          <h2 className="text-lg font-bold text-white transition group-hover:text-[#f8d977]">
            {ticket.subject}
          </h2>
          <p className="mt-1 text-sm text-white/45">
            {ticket.user?.name} — {ticket.user?.email}
          </p>
          <p className="mt-3 line-clamp-2 text-sm leading-7 text-white/65">{preview}</p>
        </div>
        <HiOutlineChevronLeft className="mt-2 h-5 w-5 shrink-0 text-white/25 transition group-hover:text-[#f8d977]" />
      </div>
    </Link>
  );
}
