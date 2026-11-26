import { mount } from "@vue/test-utils";
import { afterEach, expect, it, vi } from "vitest";
import App from "../../App.vue";
import router from "../../app/router";

afterEach(() => {
  vi.unstubAllGlobals();
});

it.each([
  {
    role: "DEVELOPER",
    heading: "Área do desenvolvedor",
    password: "original password",
    credential: "an ordinary password",
  },
  {
    role: "ADMIN",
    heading: "Área da administração",
    password: "original password",
    credential: "an ordinary password",
  },
  {
    role: "DEVELOPER",
    heading: "Área do desenvolvedor",
    password: "\u{1F511}".repeat(65),
    credential: "a password with 65 supplementary Unicode characters",
  },
])("opens the private area of a signed-in $role with $credential", async ({ role, heading, password }) => {
  const profile = { id: "user-1", name: "Ana", role };
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
    return new Response(JSON.stringify({ data: profile }), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  await router.push("/entrar");
  const page = mount(App, { global: { plugins: [router] } });
  try {
    expect(router.currentRoute.value.name).toBe("login");
    expect(page.get("header").text()).toContain("Radar Local");
    expect(page.get("h1").text()).toBe("Entre no Radar Local");
    expect(page.text()).toContain("Ainda não confirmou o email?");
    await page.get('input[type="email"]').setValue("ana@example.com");
    const passwordInput = page.get<HTMLInputElement>('input[type="password"]');
    // Setting a value programmatically in jsdom bypasses the native input limit.
    const { maxLength } = passwordInput.element;
    expect(maxLength === -1 ? Infinity : maxLength).toBeGreaterThanOrEqual(password.length);
    await passwordInput.setValue(password);
    await page.get("form").trigger("submit");
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe("/area-privada");
      expect(page.get("h1").text()).toBe(heading);
    });
    expect(page.text()).toContain("Ana");
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/\/auth\/login$/),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ email: "ana@example.com", password }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/auth\/session$/),
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  } finally {
    page.unmount();
  }
});

it.each([
  {
    scenario: "unknown email",
    email: "unknown@example.com",
    password: "original password",
  },
  {
    scenario: "wrong password",
    email: "ana@example.com",
    password: "wrong password",
  },
  {
    scenario: "inactive account",
    email: "inactive@example.com",
    password: "original password",
  },
])("displays the same login message for $scenario", async ({ email, password }) => {
  const apiError = {
    statusCode: 401,
    code: "HTTP_ERROR",
    message: "Não foi possível concluir a solicitação.",
  };
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify(apiError), { status: 401 }),
  );
  vi.stubGlobal("fetch", fetchMock);
  await router.push("/entrar");
  const page = mount(App, { global: { plugins: [router] } });

  try {
    await page.get('input[type="email"]').setValue(email);
    await page.get('input[type="password"]').setValue(password);
    await page.get("form").trigger("submit");

    await vi.waitFor(() => {
      expect(page.get('[role="alert"]').text()).toBe("Não foi possível entrar na sua conta.");
    });
    expect(router.currentRoute.value.name).toBe("login");
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      expect.stringMatching(/\/auth\/login$/),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    );
  } finally {
    page.unmount();
  }
});

it("returns to the login page when private navigation has no session", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(null, { status: 401 }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await router.push("/entrar");
  await router.push("/area-privada");
  expect(router.currentRoute.value.name).toBe("login");
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
    expect.stringMatching(/\/auth\/session$/),
    expect.objectContaining({ method: "GET", credentials: "include" }),
  );
});
