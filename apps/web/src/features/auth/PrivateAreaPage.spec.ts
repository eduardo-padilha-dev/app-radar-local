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

it("ends the current session and requires a new login to reopen the private area", async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(validSession())
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }));
  vi.stubGlobal("fetch", fetchMock);

  await router.push("/entrar");
  await router.push("/area-privada");
  const page = mount(App, { global: { plugins: [router] } });
  try {
    expect(page.get("h1").text()).toBe("Área do desenvolvedor");
    const logout = page.get("button");
    expect(logout.text()).toBe("Sair");
    await logout.trigger("click");
    await flushPromises();

    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringMatching(/\/auth\/logout$/),
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    expect(router.currentRoute.value.path).toBe("/entrar");
    expect(page.get("h1").text()).toBe("Entre no Radar Local");

    await router.push("/area-privada");
    expect(router.currentRoute.value.path).toBe("/entrar");
    expect(page.get("h1").text()).toBe("Entre no Radar Local");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  } finally {
    page.unmount();
  }
});

it("requires a new login when the private area is reopened during logout", async () => {
  let completeLogout!: () => void;
  const logoutResponse = new Promise<void>((resolve) => {
    completeLogout = resolve;
  });
  let sessionActive = true;
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
    if (String(input).endsWith("/auth/logout")) {
      await logoutResponse;
      sessionActive = false;
      return new Response(null, { status: 204 });
    }

    return sessionActive ? validSession() : new Response(null, { status: 401 });
  });
  vi.stubGlobal("fetch", fetchMock);

  await router.push("/entrar");
  await router.push("/area-privada");
  const page = mount(App, { global: { plugins: [router] } });
  try {
    const logoutButton = page.get("button");
    await logoutButton.trigger("click");
    expect(logoutButton.attributes("disabled")).toBeDefined();
    await logoutButton.trigger("click");

    await router.push("/entrar");
    const reopening = router.push("/area-privada");
    await flushPromises();
    const profileVisibleWhileLoggingOut = page.text().includes("Olá, Ana.");

    completeLogout();
    await reopening;
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("login");
    expect(page.get("h1").text()).toBe("Entre no Radar Local");
    expect(profileVisibleWhileLoggingOut).toBe(false);
    const logoutRequests = fetchMock.mock.calls.filter(([input]) => String(input).endsWith("/auth/logout"));
    expect(logoutRequests).toHaveLength(1);
  } finally {
    page.unmount();
    completeLogout();
    await flushPromises();
  }
});

it("preserves a new login submitted while the previous logout is pending", async () => {
  let completeLogout!: () => void;
  const logoutResponse = new Promise<void>((resolve) => {
    completeLogout = resolve;
  });
  const nextProfile = { ...profile, id: "user-2", name: "Marina" };
  let currentProfile: typeof profile | undefined = profile;
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
    if (String(input).endsWith("/auth/logout")) {
      await logoutResponse;
      currentProfile = undefined;
      return new Response(null, { status: 204 });
    }

    if (String(input).endsWith("/auth/login")) {
      currentProfile = nextProfile;
    }

    return currentProfile ? validSession(currentProfile) : new Response(null, { status: 401 });
  });
  vi.stubGlobal("fetch", fetchMock);

  await router.push("/entrar");
  await router.push("/area-privada");
  const page = mount(App, { global: { plugins: [router] } });
  try {
    await page.get("button").trigger("click");
    await router.push("/entrar");

    await page.get('input[type="email"]').setValue("marina@example.com");
    await page.get('input[type="password"]').setValue("original password");
    await page.get("form").trigger("submit");
    await flushPromises();
    const requestCountBeforeLogout = fetchMock.mock.calls.length;

    completeLogout();
    await flushPromises();

    expect(requestCountBeforeLogout).toBe(2);
    expect(router.currentRoute.value.name).toBe("private-area");
    expect(page.text()).toContain("Olá, Marina.");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  } finally {
    page.unmount();
    completeLogout();
    await flushPromises();
  }
});

it("keeps private content hidden if navigation after logout is blocked", async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(validSession())
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  await router.push("/entrar");
  await router.push("/area-privada");
  const page = mount(App, { global: { plugins: [router] } });
  const restoreLogin = router.beforeEach((to) => to.name !== "login");
  try {
    await page.get("button").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("private-area");
    expect(page.text()).not.toContain("Olá, Ana.");
    expect(page.get('a[href="/entrar"]').text()).toBe("Entrar");
    window.dispatchEvent(new Event("focus"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  } finally {
    restoreLogin();
    page.unmount();
  }
});

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
