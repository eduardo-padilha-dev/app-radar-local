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

export async function post<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify(body),
  }).catch((cause: unknown) => {
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
  const envelope = (await response.json().catch((cause: unknown) => {
    if (cause instanceof TypeError) throw new HttpTransportError(cause);
    throw cause;
  })) as { data: T };
  return envelope.data;
}
