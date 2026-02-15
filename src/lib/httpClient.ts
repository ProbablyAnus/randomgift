const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/$/, "");

export const buildApiUrl = (path: string) => {
  const baseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "");
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl}${path}`;
};

export class HttpClientError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(params: { status: number; code: string; message: string; details?: unknown }) {
    super(params.message);
    this.name = "HttpClientError";
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
  }
}

export type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  telegramInitData?: string;
};

const parseResponseBody = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const resolveErrorPayload = (body: unknown, status: number) => {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const code = typeof record.code === "string" ? record.code : `http_${status}`;
    const message =
      typeof record.message === "string"
        ? record.message
        : typeof record.error === "string"
          ? record.error
          : `HTTP error ${status}`;

    return { code, message, details: body };
  }

  if (typeof body === "string" && body.trim().length > 0) {
    return {
      code: `http_${status}`,
      message: body,
      details: body,
    };
  }

  return {
    code: `http_${status}`,
    message: `HTTP error ${status}`,
    details: body,
  };
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { telegramInitData, headers, ...restOptions } = options;

  const mergedHeaders = new Headers({
    Accept: "application/json",
    ...(headers ?? {}),
  });

  if (telegramInitData) {
    mergedHeaders.set("X-Telegram-Init-Data", telegramInitData);
  }

  const response = await fetch(buildApiUrl(path), {
    ...restOptions,
    headers: mergedHeaders,
  });

  const body = await parseResponseBody(response);

  if (!response.ok) {
    const errorPayload = resolveErrorPayload(body, response.status);
    throw new HttpClientError({
      status: response.status,
      ...errorPayload,
    });
  }

  return body as T;
}
