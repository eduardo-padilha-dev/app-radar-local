import { afterEach, expect, it, vi } from "vitest";
import { post } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("posts JSON to the configured API without credentials and unwraps the data envelope", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example/");
  const network = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify({ data: { value: 1 } }), { status: 201 }));
  vi.stubGlobal("fetch", network);
  await expect(post("/auth/register", { name: "Ana" })).resolves.toEqual({ value: 1 });
  expect(network).toHaveBeenCalledWith("https://api.example/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: '{"name":"Ana"}',
  });
});
