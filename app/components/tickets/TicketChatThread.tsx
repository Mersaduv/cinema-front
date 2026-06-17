"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { formatAfghanShamsiDateTime } from "../../lib/date-format";
import { isTicketMessageImage } from "../../lib/ticket-messages";
import type { TicketMessage } from "../../lib/tickets";

type TicketChatThreadProps = {
  messages: TicketMessage[];
  className?: string;
};

export default function TicketChatThread({ messages, className = "" }: TicketChatThreadProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastMessageIdRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || messages.length === 0) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const shouldScroll =
      lastMessageIdRef.current === null || lastMessageIdRef.current !== lastMessage.id;

    if (!shouldScroll) {
      return;
    }

    lastMessageIdRef.current = lastMessage.id;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`flex max-h-[min(60vh,520px)] flex-col gap-3 overflow-y-auto overscroll-contain px-1 py-2 ${className}`}
    >
      {messages.map((message) => {
        const isUser = message.sender_role === "user";
        const attachmentUrl = message.image_url;
        const attachmentIsImage = isTicketMessageImage(attachmentUrl, message.image_path);

        return (
          <div
            key={message.id}
            className={`flex ${isUser ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[min(100%,36rem)] rounded-2xl px-4 py-3 ${
                isUser
                  ? "rounded-br-md border border-[#f5c518]/25 bg-[#1a1608] text-[#ececec]"
                  : "rounded-bl-md border border-sky-400/25 bg-sky-500/10 text-sky-50"
              }`}
            >
              <p className="mb-1 text-xs font-semibold opacity-80">
                {isUser ? "شما" : "پشتیبانی"}
              </p>
              {message.body ? (
                <p className="whitespace-pre-wrap text-sm leading-7">{message.body}</p>
              ) : null}
              {attachmentUrl ? (
                attachmentIsImage ? (
                  <div className="relative mt-3 h-48 w-full min-w-48 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <Image
                      src={attachmentUrl}
                      alt=""
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex rounded-xl border border-white/15 bg-black/25 px-4 py-2 text-sm text-[#f8d977] underline-offset-4 hover:underline"
                  >
                    دانلود پیوست
                  </a>
                )
              ) : null}
              <p className="mt-2 text-[11px] opacity-60">
                {formatAfghanShamsiDateTime(message.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
