import { apiClient, type ApiResponse } from "./api";
import { normalizeImageUrl } from "./cinema-image";

export type TicketStatus = "waiting" | "answered" | "closed";

export type TicketMessage = {
  id: number;
  sender_role: "user" | "admin";
  body: string;
  image_path: string | null;
  image_url: string | null;
  created_at: string;
};

export type TicketCategory = {
  slug: string;
  label: string;
};

export type SupportTicket = {
  id: number;
  category: string;
  category_label: string;
  subject: string;
  description?: string;
  image_path: string | null;
  image_url: string | null;
  status: TicketStatus;
  admin_reply?: string | null;
  created_at: string;
  updated_at?: string;
  answered_at?: string | null;
  closed_at?: string | null;
  last_message_preview?: string;
  last_message_at?: string;
  last_message_role?: TicketMessage["sender_role"];
  message_count?: number;
  messages?: TicketMessage[];
};

export type TicketsPayload = {
  tickets: SupportTicket[];
  summary: { waiting: number; answered: number; closed: number };
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export const ticketStatusLabels: Record<TicketStatus, string> = {
  waiting: "در انتظار پاسخ",
  answered: "پاسخ داده شده",
  closed: "بسته شده",
};

export function ticketStatusBadgeClass(status: TicketStatus): string {
  switch (status) {
    case "answered":
      return "border-emerald-400/35 bg-emerald-400/10 text-emerald-200";
    case "closed":
      return "border-slate-400/35 bg-slate-400/10 text-slate-200";
    default:
      return "border-[#f5c518]/35 bg-[#f5c518]/10 text-[#f8d977]";
  }
}

export function resolveTicketImageUrl(
  imagePath: string | null | undefined,
  imageUrl: string | null | undefined,
): string | null {
  const candidate = imagePath ?? imageUrl;

  if (!candidate) {
    return null;
  }

  if (candidate.startsWith("/images/")) {
    return normalizeImageUrl(candidate);
  }

  if (/^https?:\/\//i.test(candidate)) {
    try {
      const pathname = new URL(candidate).pathname;

      if (pathname.startsWith("/images/")) {
        return normalizeImageUrl(pathname);
      }
    } catch {
      return null;
    }
  }

  return normalizeImageUrl(candidate);
}

function mapMessage(row: Record<string, unknown>): TicketMessage {
  const imagePath = (row.image_path as string | null) ?? null;
  const rawImageUrl = (row.image_url as string | null) ?? null;

  return {
    id: Number(row.id),
    sender_role: (row.sender_role as TicketMessage["sender_role"]) ?? "user",
    body: String(row.body ?? ""),
    image_path: imagePath,
    image_url: resolveTicketImageUrl(imagePath, rawImageUrl),
    created_at: String(row.created_at ?? ""),
  };
}

function mapTicket(row: Record<string, unknown>): SupportTicket {
  const imagePath = (row.image_path as string | null) ?? null;
  const rawImageUrl = (row.image_url as string | null) ?? null;

  return {
    id: Number(row.id),
    category: String(row.category ?? ""),
    category_label: String(row.category_label ?? ""),
    subject: String(row.subject ?? ""),
    description: row.description !== undefined ? String(row.description) : undefined,
    image_path: imagePath,
    image_url: resolveTicketImageUrl(imagePath, rawImageUrl),
    status: (row.status as TicketStatus) ?? "waiting",
    admin_reply: row.admin_reply !== undefined ? ((row.admin_reply as string | null) ?? null) : undefined,
    created_at: String(row.created_at ?? ""),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
    answered_at: (row.answered_at as string | null) ?? null,
    closed_at: (row.closed_at as string | null) ?? null,
    last_message_preview: row.last_message_preview ? String(row.last_message_preview) : undefined,
    last_message_at: row.last_message_at ? String(row.last_message_at) : undefined,
    last_message_role: row.last_message_role
      ? (row.last_message_role as TicketMessage["sender_role"])
      : undefined,
    message_count: row.message_count !== undefined ? Number(row.message_count) : undefined,
    messages: Array.isArray(row.messages)
      ? row.messages.map((message) => mapMessage(message as Record<string, unknown>))
      : undefined,
  };
}

export async function fetchTicketCategories(): Promise<ApiResponse<{ categories: TicketCategory[] }>> {
  return apiClient.get<{ categories: TicketCategory[] }>("/ticket-categories");
}

export async function fetchUserTickets(page = 1): Promise<ApiResponse<TicketsPayload>> {
  const response = await apiClient.get<{
    tickets: Record<string, unknown>[];
    summary: TicketsPayload["summary"];
    pagination: TicketsPayload["pagination"];
  }>(`/tickets?page=${page}`);

  if (!response.success || !response.data) {
    return response as ApiResponse<TicketsPayload>;
  }

  return {
    ...response,
    data: {
      tickets: response.data.tickets.map(mapTicket),
      summary: response.data.summary,
      pagination: response.data.pagination,
    },
  };
}

export async function fetchUserTicketsSummary(): Promise<
  ApiResponse<{ waiting: number; answered: number; closed: number }>
> {
  const response = await fetchUserTickets(1);

  if (!response.success || !response.data) {
    return {
      success: false,
      message: response.message,
    };
  }

  return {
    success: true,
    data: response.data.summary,
  };
}

export async function fetchTicket(id: number): Promise<ApiResponse<{ ticket: SupportTicket }>> {
  const response = await apiClient.get<{ ticket: Record<string, unknown> }>(`/tickets/${id}`);

  if (!response.success || !response.data?.ticket) {
    return response as ApiResponse<{ ticket: SupportTicket }>;
  }

  return {
    ...response,
    data: { ticket: mapTicket(response.data.ticket) },
  };
}

export type UploadTicketImageResult = {
  fileDirectory: string;
  fileName: string;
  image_path?: string;
  image_url?: string;
};

export async function uploadTicketImage(
  file: File,
): Promise<ApiResponse<UploadTicketImageResult>> {
  return uploadTicketAttachment(file, "image");
}

export async function uploadTicketAttachment(
  file: File,
  assetType: "image" | "ticket_attachment" = "ticket_attachment",
): Promise<ApiResponse<UploadTicketImageResult>> {
  const formData = new FormData();
  formData.append("assetType", assetType);
  formData.append("releaseYear", String(new Date().getFullYear()));
  formData.append("file", file);

  const response = await apiClient.postForm<{
    fileDirectory?: string;
    fileName?: string;
    data?: UploadTicketImageResult;
  }>("/upload", formData);

  if (!response.success) {
    return {
      success: false,
      message: response.message,
    };
  }

  const body = response as ApiResponse<UploadTicketImageResult> & UploadTicketImageResult;

  return {
    success: true,
    message: response.message,
    data: {
      fileDirectory: body.fileDirectory ?? body.data?.fileDirectory ?? "",
      fileName: body.fileName ?? body.data?.fileName ?? "",
      image_path: body.data?.image_path ?? body.image_path,
      image_url: body.data?.image_url ?? body.image_url,
    },
  };
}

export async function submitTicket(input: {
  category: string;
  description: string;
  imageDirectory?: string;
  imageFilename?: string;
}): Promise<ApiResponse<{ ticket: SupportTicket }>> {
  const response = await apiClient.post<{ ticket: Record<string, unknown> }>("/tickets", {
    category: input.category,
    description: input.description.trim(),
    image_directory: input.imageDirectory,
    image_filename: input.imageFilename,
  });

  if (!response.success || !response.data?.ticket) {
    return response as ApiResponse<{ ticket: SupportTicket }>;
  }

  return {
    ...response,
    data: { ticket: mapTicket(response.data.ticket) },
  };
}

export function validateTicketForm(input: {
  category: string;
  description: string;
}): string | null {
  if (!input.category) {
    return "دسته‌بندی را انتخاب کنید.";
  }

  if (input.description.trim().length < 5) {
    return "توضیحات باید حداقل ۵ کاراکتر باشد.";
  }

  return null;
}

export async function closeUserTicket(
  id: number,
): Promise<ApiResponse<{ ticket: SupportTicket }>> {
  const response = await apiClient.put<{ ticket: Record<string, unknown> }>(
    `/tickets/${id}/close`,
    {},
  );

  if (!response.success || !response.data?.ticket) {
    return response as ApiResponse<{ ticket: SupportTicket }>;
  }

  return {
    ...response,
    data: { ticket: mapTicket(response.data.ticket) },
  };
}

export async function sendTicketMessage(
  id: number,
  payload: {
    body: string;
    imageDirectory?: string;
    imageFilename?: string;
  },
): Promise<ApiResponse<{ ticket: SupportTicket }>> {
  const response = await apiClient.post<{ ticket: Record<string, unknown> }>(
    `/tickets/${id}/messages`,
    {
      body: payload.body.trim(),
      image_directory: payload.imageDirectory,
      image_filename: payload.imageFilename,
    },
  );

  if (!response.success || !response.data?.ticket) {
    return response as ApiResponse<{ ticket: SupportTicket }>;
  }

  return {
    ...response,
    data: { ticket: mapTicket(response.data.ticket) },
  };
}
