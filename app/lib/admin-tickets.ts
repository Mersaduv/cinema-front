import { adminApiErrorMessage, unwrapAdminListPayload } from "./admin-api";
import { apiClient, type ApiResponse } from "./api";
import {
  resolveTicketImageUrl,
  type SupportTicket,
} from "./tickets";

export type AdminSupportTicket = SupportTicket & {
  user?: { id: number; name: string; email: string } | null;
};

type AdminTicketsPayload = {
  tickets: AdminSupportTicket[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

function mapAdminTicket(row: Record<string, unknown>): AdminSupportTicket {
  const imagePath = (row.image_path as string | null) ?? null;
  const rawImageUrl = (row.image_url as string | null) ?? null;
  const user = (row.user as Record<string, unknown> | null) ?? null;

  return {
    id: Number(row.id),
    category: String(row.category ?? ""),
    category_label: String(row.category_label ?? ""),
    subject: String(row.subject ?? ""),
    description: row.description !== undefined ? String(row.description) : undefined,
    image_path: imagePath,
    image_url: resolveTicketImageUrl(imagePath, rawImageUrl),
    status: (row.status as AdminSupportTicket["status"]) ?? "waiting",
    admin_reply: row.admin_reply !== undefined ? ((row.admin_reply as string | null) ?? null) : undefined,
    created_at: String(row.created_at ?? ""),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
    answered_at: (row.answered_at as string | null) ?? null,
    closed_at: (row.closed_at as string | null) ?? null,
    last_message_preview: row.last_message_preview ? String(row.last_message_preview) : undefined,
    last_message_at: row.last_message_at ? String(row.last_message_at) : undefined,
    last_message_role: row.last_message_role
      ? (row.last_message_role as "user" | "admin")
      : undefined,
    message_count: row.message_count !== undefined ? Number(row.message_count) : undefined,
    messages: Array.isArray(row.messages)
      ? row.messages.map((message) => {
          const messageRow = message as Record<string, unknown>;
          const imagePath = (messageRow.image_path as string | null) ?? null;
          const rawImageUrl = (messageRow.image_url as string | null) ?? null;

          return {
            id: Number(messageRow.id),
            sender_role: (messageRow.sender_role as "user" | "admin") ?? "user",
            body: String(messageRow.body ?? ""),
            image_path: imagePath,
            image_url: resolveTicketImageUrl(imagePath, rawImageUrl),
            created_at: String(messageRow.created_at ?? ""),
          };
        })
      : undefined,
    user: user
      ? {
          id: Number(user.id),
          name: String(user.name ?? ""),
          email: String(user.email ?? ""),
        }
      : null,
  };
}

function unwrapSingleTicket(
  response: ApiResponse<{ ticket: AdminSupportTicket }>,
): AdminSupportTicket | null {
  const raw =
    (response.data as { ticket?: Record<string, unknown> } | undefined)?.ticket ??
    ((response as { ticket?: Record<string, unknown> }).ticket ?? null);

  return raw ? mapAdminTicket(raw) : null;
}

export async function fetchAdminTicket(id: number): Promise<AdminSupportTicket> {
  const response = await apiClient.get<{ ticket: AdminSupportTicket }>(`/admin/tickets/${id}`);
  const ticket = unwrapSingleTicket(response);

  if (!response.success || !ticket) {
    throw new Error(adminApiErrorMessage(response, "دریافت تیکت با خطا روبه‌رو شد."));
  }

  return ticket;
}

export async function fetchAdminTickets(params?: {
  page?: number;
  status?: string;
  search?: string;
}): Promise<AdminTicketsPayload> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  const suffix = query.toString() ? `?${query.toString()}` : "";

  const response = await apiClient.get<AdminTicketsPayload>(`/admin/tickets${suffix}`);
  const payload = unwrapAdminListPayload<AdminTicketsPayload>(response, "tickets");

  if (!payload) {
    throw new Error(adminApiErrorMessage(response, "دریافت تیکت‌ها با خطا روبه‌رو شد."));
  }

  return {
    tickets: (payload.tickets ?? []).map((row) =>
      mapAdminTicket(row as unknown as Record<string, unknown>),
    ),
    pagination: payload.pagination ?? {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0,
    },
  };
}

export async function updateAdminTicket(
  id: number,
  payload: {
    status?: string;
    admin_reply?: string | null;
    imageDirectory?: string;
    imageFilename?: string;
  },
): Promise<ApiResponse<{ ticket: AdminSupportTicket }>> {
  const response = await apiClient.put<{ ticket: AdminSupportTicket }>(
    `/admin/tickets/${id}`,
    {
      status: payload.status,
      admin_reply: payload.admin_reply,
      image_directory: payload.imageDirectory,
      image_filename: payload.imageFilename,
    },
  );
  const ticket = unwrapSingleTicket(response);

  if (!response.success) {
    return response;
  }

  if (!ticket) {
    return {
      success: false,
      message: "پاسخ سرور نامعتبر بود.",
    };
  }

  return {
    ...response,
    data: { ticket },
  };
}
