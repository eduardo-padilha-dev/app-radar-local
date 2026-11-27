export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code?: string,
    readonly details?: unknown,
  ) {
    super("Não foi possível concluir a solicitação.");
  }
}

export class HttpTransportError extends Error {
  constructor(cause: unknown) {
    super("Não foi possível receber a resposta da API.", { cause });
  }
}

type HttpOptions = Pick<RequestInit, "credentials">;

export function post<T>(path: string, body: unknown, options?: HttpOptions): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...options,
  });
}

export async function postWithoutContent(path: string, options?: HttpOptions): Promise<void> {
  const response = await requestResponse(path, { method: "POST", ...options });
  if (response.status !== 204) throw new HttpError(response.status);
}

export function get<T>(path: string, options?: HttpOptions): Promise<T> {
  return request<T>(path, { method: "GET", ...options });
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await requestResponse(path, init);
  const envelope = (await response.json().catch((cause: unknown) => {
    if (cause instanceof TypeError) throw new HttpTransportError(cause);
    throw cause;
  })) as { data: T };
  return envelope.data;
}

async function requestResponse(path: string, init: RequestInit): Promise<Response> {
  const baseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}${path}`, { credentials: "omit", ...init }).catch((cause: unknown) => {
    throw new HttpTransportError(cause);
  });
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => undefined);
    if (typeof payload === "object" && payload !== null) {
      const code = "code" in payload && typeof payload.code === "string" ? payload.code : undefined;
      const details = "details" in payload ? payload.details : undefined;
      throw new HttpError(response.status, code, details);
    }
    throw new HttpError(response.status);
  }
  return response;
}
