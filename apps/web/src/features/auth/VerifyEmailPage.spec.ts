import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import indexHtml from "../../../index.html?raw";
import App from "../../App.vue";
import existingRouter from "../../app/router";

afterEach(() => {
  vi.unstubAllGlobals();
});

it("sets the referrer policy before loading the initial resources", () => {
  const html = new DOMParser().parseFromString(indexHtml, "text/html");
  const policy = html.head.querySelector('meta[name="referrer"]');
  const firstResource = html.querySelector("link[href], script[src]");

  expect(policy?.getAttribute("content")).toBe("no-referrer");
  expect(firstResource && policy?.compareDocumentPosition(firstResource)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
});

it("confirms the email when the user opens the registration link", async () => {
  const token = "A".repeat(43);
  const link = new URL(`https://web.example/confirmar-email?token=${token}`);
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
    return new Response(JSON.stringify({ data: { status: "confirmed" } }), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: existingRouter.options.routes,
  });
  await router.push(link.pathname + link.search);
  await router.isReady();
  const page = mount(App, { global: { plugins: [router] } });
  try {
    await flushPromises();

    expect(page.get("[role=status]").text()).toBe("E-mail confirmado");
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      expect.stringMatching(/\/auth\/verify-email$/),
      expect.objectContaining({
        method: "POST",
        credentials: "omit",
        body: JSON.stringify({ token }),
      }),
    );
    expect(router.currentRoute.value.fullPath).toBe(link.pathname + link.search);
  } finally {
    page.unmount();
  }
});
