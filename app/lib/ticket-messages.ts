import type { SupportTicket, TicketMessage } from "./tickets";

export function ticketMessagesForDisplay(ticket: SupportTicket): TicketMessage[] {
  if (ticket.messages && ticket.messages.length > 0) {
    return ticket.messages;
  }

  const fallback: TicketMessage[] = [
    {
      id: 0,
      sender_role: "user",
      body: ticket.description ?? "",
      image_path: ticket.image_path ?? null,
      image_url: ticket.image_url ?? null,
      created_at: ticket.created_at,
    },
  ];

  if (ticket.admin_reply) {
    fallback.push({
      id: -1,
      sender_role: "admin",
      body: ticket.admin_reply,
      image_path: null,
      image_url: null,
      created_at: ticket.answered_at ?? ticket.updated_at ?? ticket.created_at,
    });
  }

  return fallback;
}

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

export function isTicketMessageImage(
  imageUrl: string | null | undefined,
  imagePath?: string | null,
): boolean {
  const candidate = imagePath ?? imageUrl ?? "";
  const extension = candidate.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "";

  return IMAGE_EXTENSIONS.has(extension);
}

export function ticketListPreview(ticket: SupportTicket): string {
  if (ticket.last_message_preview) {
    return ticket.last_message_preview;
  }

  return ticket.description?.trim() || ticket.subject;
}
