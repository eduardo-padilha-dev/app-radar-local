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

it("identifies a missing token as invalid without contacting the API", async () => {
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
  const page = await openVerificationPage("/confirmar-email");
  try {
    expect(page.get("[role=alert]").text()).toBe("O link de confirmação é inválido.");
    expect(page.text()).not.toContain("Reenviar link de confirmação");
    expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    page.unmount();
  }
});

it("identifies an invalid link reported by the API", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>().mockImplementation(async () => {
      return new Response(JSON.stringify({ code: "VERIFICATION_LINK_INVALID" }), { status: 400 });
    }),
  );
  const page = await openVerificationPage("/confirmar-email?token=invalid");
  try {
    expect(page.get("[role=alert]").text()).toBe("O link de confirmação é inválido.");
    expect(page.text()).not.toContain("Reenviar link de confirmação");
  } finally {
    page.unmount();
  }
});

it("identifies an expired link and offers resend with an email field", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
    return new Response(JSON.stringify({ code: "VERIFICATION_LINK_EXPIRED" }), { status: 410 });
  });
  vi.stubGlobal("fetch", fetchMock);
  const page = await openVerificationPage("/confirmar-email?token=" + "A".repeat(43));
  try {
    expect(page.get("[role=alert]").text()).toBe("O link de confirmação expirou.");
    expect(page.get("summary").text()).toBe("Reenviar link de confirmação");
    expect(page.get("label").text()).toBe("E-mail");
    expect(page.get("button[type=submit]").attributes()).toHaveProperty("disabled");
    expect(page.get("input").attributes("type")).toBe("email");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  } finally {
    page.unmount();
  }
});

it.each([
  ["before confirmation was saved", false, "E-mail confirmado"],
  ["after confirmation was saved", true, "E-mail já confirmado"],
])("retries with the same link when the response is lost %s", async (_case, saved, message) => {
  const token = "A".repeat(43);
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockRejectedValueOnce(new TypeError("Connection lost"))
    .mockImplementationOnce(async () => {
      const status = saved ? "already-confirmed" : "confirmed";
      return new Response(JSON.stringify({ data: { status } }), { status: 200 });
    });
  vi.stubGlobal("fetch", fetchMock);
  const page = await openVerificationPage("/confirmar-email?token=" + token);
  try {
    expect(page.get("[role=alert]").text()).toBe("Não foi possível confirmar o e-mail.");
    const retry = page.get("button");
    expect(retry.text()).toBe("Tentar novamente");
    await retry.trigger("click");
    await flushPromises();

    expect(page.get("[role=status]").text()).toBe(message);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/auth\/verify-email$/),
      expect.objectContaining({
        method: "POST",
        credentials: "omit",
        body: JSON.stringify({ token }),
      }),
    );
  } finally {
    page.unmount();
  }
});

it("shows the saved confirmation when the original link is reopened", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>().mockImplementation(async () => {
      return new Response(JSON.stringify({ data: { status: "already-confirmed" } }), { status: 200 });
    }),
  );
  const page = await openVerificationPage("/confirmar-email?token=" + "A".repeat(43));
  try {
    expect(page.get("[role=status]").text()).toBe("E-mail já confirmado");
  } finally {
    page.unmount();
  }
});

async function openVerificationPage(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: existingRouter.options.routes,
  });
  await router.push(path);
  await router.isReady();
  const page = mount(App, { global: { plugins: [router] } });
  await flushPromises();
  return page;
}
