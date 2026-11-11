export async function post<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Não foi possível concluir a solicitação.");
  const envelope = (await response.json()) as { data: T };
  return envelope.data;
}
