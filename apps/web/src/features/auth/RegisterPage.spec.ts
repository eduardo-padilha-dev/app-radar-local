import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "../../App.vue";
import existingRouter from "../../app/router";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("registration page", () => {
  it("submits through the real page and HTTP client, blocks repeat submission and reports CA1 without starting a session", async () => {
    let accept!: (value: Response) => void;
    const fetchMock = vi.fn<typeof fetch>(
      () =>
        new Promise<Response>((resolve) => {
          accept = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const storage = vi.spyOn(Storage.prototype, "setItem");
    const router = createRouter({
      history: createMemoryHistory(),
      routes: existingRouter.options.routes,
    });
    await router.push("/criar-conta");
    await router.isReady();
    const page = mount(App, { global: { plugins: [router] } });
    await flushPromises();
    expect(page.find("form").exists()).toBe(true);
    await page.get("[name=name]").setValue("Ana");
    await page.get("[name=email]").setValue("ana@example.com");
    await page.get("[name=password]").setValue("same password");
    await page.get("form").trigger("submit");
    expect(page.get("button[type=submit]").attributes("disabled")).toBeDefined();
    await page.get("form").trigger("submit");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]).toEqual([
      expect.stringMatching(/\/auth\/register$/),
      expect.objectContaining({
        method: "POST",
        credentials: "omit",
        body: JSON.stringify({ name: "Ana", email: "ana@example.com", password: "same password" }),
      }),
    ]);
    accept(
      new Response(
        JSON.stringify({ data: { accountCreated: true, verificationEmailStatus: "accepted" } }),
        { status: 201 },
      ),
    );
    await flushPromises();
    expect(page.get("[role=status]").text()).toBe(
      "Conta criada. Confira seu e-mail para confirmar o cadastro.",
    );
    expect(router.currentRoute.value.path).toBe("/criar-conta");
    expect(storage).not.toHaveBeenCalled();
    expect(page.findAll("a, button")).toHaveLength(0);
    page.unmount();
    storage.mockRestore();
  });
});
