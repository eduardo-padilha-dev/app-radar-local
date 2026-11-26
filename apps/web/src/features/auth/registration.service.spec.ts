import { afterEach, expect, it, vi } from "vitest";
import { register } from "./registration.service";

afterEach(() => vi.unstubAllGlobals());
it("adapts the accepted API response to the registration result using the real HTTP client", async () => {
  const network = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        data: {
          accountCreated: true,
          verificationEmailStatus: "accepted",
        },
      }),
      { status: 201 },
    ),
  );
  vi.stubGlobal("fetch", network);
  await expect(
    register({ name: "Ana", email: "ana@example.com", password: "same password" }),
  ).resolves.toEqual({ accountCreated: true, verificationEmailStatus: "accepted" });
  expect(network).toHaveBeenCalledTimes(1);
});
