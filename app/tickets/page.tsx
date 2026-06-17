"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HiOutlineChatAlt2, HiOutlineCheckCircle, HiOutlineChevronLeft, HiOutlinePlus } from "react-icons/hi";
import ProtectedRoute from "../components/ProtectedRoute";
import ProfileShell from "../components/profile/ProfileShell";
import { formatAfghanShamsiDate, formatAfghanShamsiDateTime } from "../lib/date-format";
import { ticketListPreview } from "../lib/ticket-messages";
import {
  fetchUserTickets,
  ticketStatusBadgeClass,
  ticketStatusLabels,
  type SupportTicket,
} from "../lib/tickets";

function TicketsPageContent() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [waiting, setWaiting] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [closed, setClosed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const response = await fetchUserTickets();

      if (cancelled) {
        return;
      }

      if (!response.success || !response.data) {
        setError(response.message || "دریافت تیکت‌ها انجام نشد.");
        setTickets([]);
      } else {
        setTickets(response.data.tickets);
        setWaiting(response.data.summary.waiting);
        setAnswered(response.data.summary.answered);
        setClosed(response.data.summary.closed);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ProfileShell active="tickets">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-black text-[#f8d977]">تیکت‌ها</h1>
        <p className="max-w-3xl text-sm leading-7 text-[#d0d0d0]">
          تیکت‌های قبلی خود را ببینید یا با دکمه زیر درخواست پشتیبانی جدید ثبت کنید.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#f5c518]/20 bg-[#121212]/90 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5c518]/15">
              <HiOutlineChatAlt2 className="h-6 w-6 text-[#f8d977]" />
            </div>
            <div>
              <p className="mb-1 text-sm text-[#c3c3c3]">تیکت‌های منتظر پاسخ</p>
              <p className="text-3xl font-black text-white">{waiting}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#f5c518]/20 bg-[#121212]/90 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
              <HiOutlineCheckCircle className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <p className="mb-1 text-sm text-[#c3c3c3]">تیکت‌های پاسخ‌داده‌شده</p>
              <p className="text-3xl font-black text-white">{answered}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#f5c518]/20 bg-[#121212]/90 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-500/15">
              <HiOutlineCheckCircle className="h-6 w-6 text-slate-300" />
            </div>
            <div>
              <p className="mb-1 text-sm text-[#c3c3c3]">تیکت‌های بسته‌شده</p>
              <p className="text-3xl font-black text-white">{closed}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white">تیکت‌های شما</h2>
        <Link
          href="/tickets/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#f5c518] px-5 py-2.5 text-sm font-black text-black transition hover:bg-[#e7b900]"
        >
          <HiOutlinePlus className="h-5 w-5" />
          ثبت تیکت جدید
        </Link>
      </div>

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

      {!loading && !error && tickets.length === 0 ? (
        <div className="rounded-2xl border border-[#f5c518]/15 bg-[#121212]/80 p-12 text-center">
          <p className="text-lg font-semibold text-white/85">هیچ تیکتی ثبت نشده است.</p>
          <p className="mt-2 text-sm text-[#b5b5b5]">برای ارتباط با پشتیبانی، اولین تیکت خود را ثبت کنید.</p>
          <Link
            href="/tickets/new"
            className="mt-6 inline-flex rounded-xl bg-[#f5c518] px-6 py-3 text-sm font-black text-black transition hover:bg-[#e7b900]"
          >
            ثبت تیکت جدید
          </Link>
        </div>
      ) : null}

      {!loading && tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="group block rounded-2xl border border-[#2c2c2c] bg-[#111111] p-5 transition hover:border-[#f5c518]/35 hover:bg-[#151515]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${ticketStatusBadgeClass(ticket.status)}`}
                    >
                      {ticketStatusLabels[ticket.status]}
                    </span>
                    <span className="text-sm text-[#b5b5b5]">
                      {formatAfghanShamsiDate(ticket.created_at)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white transition group-hover:text-[#f8d977]">
                    {ticket.subject}
                  </h3>
                  <p className="mt-1 text-sm text-[#a8a8a8]">{ticket.category_label}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-7 text-[#c7c7c7]">
                    {ticketListPreview(ticket)}
                  </p>
                  <p className="mt-2 text-xs text-[#8f8f8f]">
                    آخرین فعالیت:{" "}
                    {formatAfghanShamsiDateTime(ticket.last_message_at ?? ticket.created_at)}
                    {ticket.message_count && ticket.message_count > 1
                      ? ` — ${ticket.message_count} پیام`
                      : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {ticket.image_url ? (
                    <div className="relative h-16 w-24 overflow-hidden rounded-lg border border-[#f5c518]/20 bg-black/40">
                      <Image
                        src={ticket.image_url}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <HiOutlineChevronLeft className="h-5 w-5 text-[#666] transition group-hover:text-[#f8d977]" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </ProfileShell>
  );
}

export default function TicketsPage() {
  return (
    <ProtectedRoute>
      <TicketsPageContent />
    </ProtectedRoute>
  );
}
