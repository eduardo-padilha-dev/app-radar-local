import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, expect, it, vi } from "vitest";
import App from "../../App.vue";
import router from "../../app/router";

afterEach(() => {
  vi.unstubAllGlobals();
});

const profile = { id: "user-1", name: "Ana", role: "DEVELOPER" };

function validSession(sessionProfile = profile) {
  return new Response(JSON.stringify({ data: sessionProfile }), { status: 200 });
}

it("requires a new login when an open private area is revisited after the session expires", async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(validSession())
    .mockResolvedValueOnce(validSession())
    .mockResolvedValueOnce(new Response(null, { status: 401 }));
  vi.stubGlobal("fetch", fetchMock);

  await router.push("/entrar");
  await router.push("/area-privada");
  const page = mount(App, { global: { plugins: [router] } });
  try {
    expect(page.get("h1").text()).toBe("Área do desenvolvedor");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("focus"));
    await flushPromises();
    expect(page.get("h1").text()).toBe("Área do desenvolvedor");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("focus"));

    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe("/entrar");
      expect(page.get("h1").text()).toBe("Entre no Radar Local");
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringMatching(/\/auth\/session$/),
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );

    window.dispatchEvent(new Event("focus"));
    expect(fetchMock).toHaveBeenCalledTimes(3);
  } finally {
    page.unmount();
  }
});

it.each([
  ["a transport failure", () => Promise.reject(new TypeError("Network unavailable"))],
  ["a server error", () => Promise.resolve(new Response(null, { status: 503 }))],
])("offers a retry after %s while revalidating the private area", async (_failure, fail) => {
  let completeRetry!: (response: Response) => void;
  const retryResponse = new Promise<Response>((resolve) => {
    completeRetry = resolve;
  });
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(validSession())
    .mockImplementationOnce(fail)
    .mockReturnValueOnce(retryResponse);
  vi.stubGlobal("fetch", fetchMock);

  await router.push("/entrar");
  await router.push("/area-privada");
  const page = mount(App, { global: { plugins: [router] } });
  try {
    expect(page.text()).toContain("Olá, Ana.");

    window.dispatchEvent(new Event("focus"));
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/area-privada");
    expect(page.get('[role="alert"]').text()).toBe("Não foi possível verificar sua sessão.");
    expect(page.text()).not.toContain("Olá, Ana.");

    const retry = page.get("button");
    expect(retry.text()).toBe("Tentar novamente");
    await retry.trigger("click");
    expect(page.get('[role="status"]').text()).toBe("Verificando sua sessão…");
    window.dispatchEvent(new Event("focus"));
    expect(fetchMock).toHaveBeenCalledTimes(3);

    completeRetry(validSession({ ...profile, name: "Ana Paula" }));
    await flushPromises();

    expect(page.get("h1").text()).toBe("Área do desenvolvedor");
    expect(page.text()).toContain("Olá, Ana Paula.");
    expect(page.find('[role="alert"]').exists()).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  } finally {
    page.unmount();
  }
});

it.each([
  {
    failure: "the login page fails to load",
    preventLogin() {
      const components = router.getRoutes().find((route) => route.name === "login")!.components!;
      const originalLogin = components.default!;
      components.default = () => Promise.reject(new Error("Login page unavailable"));
      const removeErrorHandler = router.onError(() => {});
      return () => {
        components.default = originalLogin;
        removeErrorHandler();
      };
    },
  },
  {
    failure: "navigation to login is aborted",
    preventLogin() {
      return router.beforeEach((to) => to.name !== "login");
    },
  },
])("allows a new login after session expiry when $failure", async ({ preventLogin }) => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(validSession())
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(validSession())
    .mockResolvedValueOnce(validSession({ ...profile, name: "Ana Paula" }));
  vi.stubGlobal("fetch", fetchMock);

  await router.push("/area-privada");
  const page = mount(App, { global: { plugins: [router] } });
  try {
    expect(page.text()).toContain("Olá, Ana.");

    const restoreLogin = preventLogin();
    try {
      window.dispatchEvent(new Event("focus"));
      await flushPromises();

      expect(router.currentRoute.value.name).toBe("private-area");
      expect(page.get('[role="alert"]').text()).toBe("Não foi possível verificar sua sessão.");
      expect(page.text()).not.toContain("Olá, Ana.");
      expect(page.find('[role="status"]').exists()).toBe(false);
    } finally {
      restoreLogin();
    }

    await page.get("button").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("login");
    expect(page.get("h1").text()).toBe("Entre no Radar Local");

    await page.get('input[type="email"]').setValue("ana@example.com");
    await page.get('input[type="password"]').setValue("original password");
    await page.get("form").trigger("submit");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("private-area");
    expect(page.text()).toContain("Olá, Ana Paula.");
    expect(fetchMock).toHaveBeenCalledTimes(5);
  } finally {
    page.unmount();
  }
});
