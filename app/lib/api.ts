import { tokenStorage } from './token-storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005/api';

export interface ApiResponse<T> {
  success: boolean;
  status?: number;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requestOptions?: { timeoutMs?: number; signal?: AbortSignal },
  ): Promise<ApiResponse<T>> {
    const token = tokenStorage.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const externalSignal = requestOptions?.signal;

    if (externalSignal?.aborted) {
      return {
        success: false,
        message: 'درخواست لغو شد.',
      };
    }

    const abortFromExternal = () => controller.abort();
    externalSignal?.addEventListener('abort', abortFromExternal);

    const timeoutMs = requestOptions?.timeoutMs;
    const timeoutId =
      typeof timeoutMs === 'number' && timeoutMs > 0
        ? window.setTimeout(() => controller.abort(), timeoutMs)
        : null;

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        cache: 'no-store',
        ...options,
        headers,
        signal: controller.signal,
      });

      let data: Record<string, unknown> = {};

      try {
        data = (await response.json()) as Record<string, unknown>;
      } catch {
        data = {};
      }

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message:
            (typeof data.message === 'string' && data.message) || 'An error occurred',
          errors: data.errors as Record<string, string[]> | undefined,
        };
      }

      return {
        success: true,
        status: response.status,
        ...data,
      } as ApiResponse<T>;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          message: 'درخواست به دلیل طولانی شدن لغو شد.',
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    } finally {
      externalSignal?.removeEventListener('abort', abortFromExternal);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    }
  }

  async get<T>(
    endpoint: string,
    requestOptions?: { timeoutMs?: number; signal?: AbortSignal },
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, requestOptions);
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    requestOptions?: { timeoutMs?: number; signal?: AbortSignal },
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      requestOptions,
    );
  }

  async postForm<T>(endpoint: string, body: FormData): Promise<ApiResponse<T>> {
    const token = tokenStorage.getToken();

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        cache: 'no-store',
        headers,
        body,
      });

      let data: Record<string, unknown> = {};

      try {
        data = (await response.json()) as Record<string, unknown>;
      } catch {
        data = {};
      }

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message:
            (typeof data.message === 'string' && data.message) || 'An error occurred',
          errors: data.errors as Record<string, string[]> | undefined,
        };
      }

      return {
        success: true,
        status: response.status,
        ...data,
      } as ApiResponse<T>;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    requestOptions?: { timeoutMs?: number; signal?: AbortSignal },
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
      requestOptions,
    );
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
