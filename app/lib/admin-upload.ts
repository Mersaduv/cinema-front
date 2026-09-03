import { apiClient, type ApiResponse } from "./api";
import type { ResponsiveImageAsset } from "./cinema-image";

export type AdminCatalogImageUploadResult = {
  image_path: string;
  image?: ResponsiveImageAsset | null;
  synced?: {
    entity_type: string;
    entity_id: number;
    image_role: "poster" | "backdrop";
    image_path: string;
  } | null;
};

export type AdminCatalogImageUploadOptions = {
  entityType?: "movie" | "series";
  entityId?: number | string | null;
  imageRole?: "poster" | "backdrop" | "still";
};

const MAX_ADMIN_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

export function formatAdminImageUploadLimit(): string {
  return "۱۰ مگابایت";
}

export function validateAdminImageUploadFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "فقط فایل تصویر مجاز است.";
  }

  if (file.size > MAX_ADMIN_IMAGE_UPLOAD_BYTES) {
    return `حجم فایل نباید بیشتر از ${formatAdminImageUploadLimit()} باشد.`;
  }

  return null;
}

export async function uploadAdminCatalogImage(
  file: File,
  options: AdminCatalogImageUploadOptions = {},
): Promise<ApiResponse<AdminCatalogImageUploadResult>> {
  const formData = new FormData();
  formData.append("file", file);

  if (options.entityType) {
    formData.append("entity_type", options.entityType);
  }

  if (options.entityId != null && String(options.entityId).trim() !== "") {
    formData.append("entity_id", String(options.entityId));
  }

  if (options.imageRole) {
    formData.append("image_role", options.imageRole);
  }

  const response = await apiClient.postForm<{
    data?: AdminCatalogImageUploadResult;
    image_path?: string;
    image?: ResponsiveImageAsset | null;
    synced?: AdminCatalogImageUploadResult["synced"];
  }>("/admin/upload/image", formData);

  if (!response.success) {
    return {
      success: false,
      message: response.message,
      errors: response.errors,
    };
  }

  const body = response as ApiResponse<AdminCatalogImageUploadResult> & {
    data?: AdminCatalogImageUploadResult;
    image_path?: string;
    image?: ResponsiveImageAsset | null;
    synced?: AdminCatalogImageUploadResult["synced"];
  };

  const imagePath = body.data?.image_path ?? body.image_path;

  if (!imagePath) {
    return {
      success: false,
      message: "پاسخ سرور برای آپلود تصویر نامعتبر بود.",
    };
  }

  return {
    success: true,
    data: {
      image_path: imagePath,
      image: body.data?.image ?? body.image ?? null,
      synced: body.data?.synced ?? body.synced ?? null,
    },
  };
}
