import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "../../App.vue";
import existingRouter from "../../app/router";
import RegisterPage from "./RegisterPage.vue";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("registration page", () => {
  it.each([
    [502, "VERIFICATION_EMAIL_UNCONFIRMED", true],
    [502, "INTERNAL_ERROR", false],
    [500, "VERIFICATION_EMAIL_UNCONFIRMED", false],
  ])("handles status %i and code %s without assuming delivery", async (status, code, created) => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValueOnce(new Response(
      JSON.stringify({
        statusCode: status,
        code,
        details: { accountCreated: true, emailVerificationPending: true },
      }),
      { status },
    ));
    vi.stubGlobal("fetch", fetchMock);
    const page = mount(RegisterPage);
    try {
      await page.get("#name").setValue("Ana");
      await page.get("#email").setValue("ana@example.com");
      await page.get("#password").setValue("same password");
      await page.get("form").trigger("submit");
      await flushPromises();

      expect(page.get("[role=alert]").text()).toBe(
        created
          ? "Sua conta foi criada, mas não conseguimos confirmar o envio do e-mail de confirmação. Tente reenviar o link."
          : "Não foi possível concluir a solicitação.",
      );
      expect(page.find("form").exists()).toBe(!created);
      expect(page.findAll("a")).toHaveLength(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      page.unmount();
    }
  });

  it("requests a new link on the registration page using the email already entered", async () => {
    const email = "Ana@example.com";
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(
        JSON.stringify({
          code: "VERIFICATION_EMAIL_UNCONFIRMED",
          details: { accountCreated: true, emailVerificationPending: true },
        }),
        { status: 502 },
      ))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { retryAfterSeconds: 60 } }), { status: 202 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: existingRouter.options.routes,
    });
    await router.push("/criar-conta");
    await router.isReady();
    const page = mount(App, { global: { plugins: [router] } });
    try {
      await flushPromises();
      await page.get("#name").setValue("Ana");
      await page.get("#email").setValue(email);
      await page.get("#password").setValue("same password");
      await page.get("form").trigger("submit");
      await flushPromises();

      const resend = page.get("button");
      expect(resend.text()).toBe("Reenviar link de confirmação");
      await resend.trigger("click");
      await flushPromises();

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringMatching(/\/auth\/resend-verification$/),
        expect.objectContaining({
          method: "POST",
          credentials: "omit",
          body: JSON.stringify({ email }),
        }),
      );
      expect(page.get("[role=status]").text()).toContain(
        "Se houver uma conta pendente para este e-mail, verifique sua caixa de entrada.",
      );
      expect(page.get("[role=status]").text()).toContain("60 segundos");
      expect(resend.attributes("disabled")).toBeDefined();
    } finally {
      page.unmount();
    }
  });

  it("allows another resend from registration 60 seconds after losing the response", async () => {
    const email = "ana@example.com";
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(
        JSON.stringify({
          code: "VERIFICATION_EMAIL_UNCONFIRMED",
          details: { accountCreated: true, emailVerificationPending: true },
        }),
        { status: 502 },
      ))
      .mockRejectedValueOnce(new TypeError("Connection lost"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { retryAfterSeconds: 60 } }), { status: 202 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const page = mount(RegisterPage);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      await page.get("#name").setValue("Ana");
      await page.get("#email").setValue(email);
      await page.get("#password").setValue("same password");
      await page.get("form").trigger("submit");
      await flushPromises();

      const resend = page.get("button");
      await resend.trigger("click");
      await flushPromises();
      expect(page.get("[role=status]").text()).toBe(
        "Não foi possível receber a resposta da solicitação. Aguarde 60 segundos para tentar novamente.",
      );
      expect(resend.attributes("disabled")).toBeDefined();

      await vi.advanceTimersByTimeAsync(59_999);
      await resend.trigger("click");
      expect(resend.attributes("disabled")).toBeDefined();
      expect(fetchMock).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(1);
      expect(resend.attributes("disabled")).toBeUndefined();
      expect(page.get("[role=status]").text()).toBe(
        "Não foi possível receber a resposta da solicitação.",
      );
      await resend.trigger("click");
      await flushPromises();
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringMatching(/\/auth\/resend-verification$/),
        expect.objectContaining({ body: JSON.stringify({ email }) }),
      );
      expect(page.get("[role=status]").text()).toContain(
        "Se houver uma conta pendente para este e-mail, verifique sua caixa de entrada.",
      );
      expect(resend.attributes("disabled")).toBeDefined();
    } finally {
      page.unmount();
      vi.useRealTimers();
    }
  });

  it.each(["before the headers", "while reading the body"] as const)(
    "allows retry after losing the first registration response %s",
    async (failure) => {
      const input = { name: "Ana", email: "ana@example.com", password: "same password" };
      const duplicateMessage =
        "Este e-mail já está cadastrado. Entre na sua conta ou solicite o reenvio da confirmação.";
      const registeredEmails = new Set<string>();
      const fetchMock = vi.fn<typeof fetch>(async (_url, options) => {
        const { email } = JSON.parse(String(options?.body)) as { email: string };
        if (registeredEmails.has(email)) {
          return new Response(
            JSON.stringify({ statusCode: 409, code: "EMAIL_ALREADY_REGISTERED" }),
            { status: 409 },
          );
        }

        registeredEmails.add(email);
        const networkError = new TypeError("Network request failed");
        if (failure === "before the headers") throw networkError;
        const body = new ReadableStream({
          start(controller) {
            controller.error(networkError);
          },
        });
        return new Response(body, { status: 201 });
      });
      vi.stubGlobal("fetch", fetchMock);
      const page = mount(RegisterPage);
      try {
        for (const [field, value] of Object.entries(input)) {
          await page.get(`#${field}`).setValue(value);
        }
        await page.get("form").trigger("submit");
        await flushPromises();

        expect(registeredEmails).toEqual(new Set([input.email]));
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(page.get("[role=alert]").text()).toBe(
          "Não conseguimos confirmar o resultado do cadastro. Tente novamente.",
        );
        expect(page.find("[role=status]").exists()).toBe(false);
        expect(page.get("button[type=submit]").attributes("disabled")).toBeUndefined();
        for (const [field, value] of Object.entries(input)) {
          expect(page.get<HTMLInputElement>(`#${field}`).element.value).toBe(value);
        }

        await page.get("form").trigger("submit");
        await flushPromises();

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock).toHaveBeenLastCalledWith(
          expect.stringMatching(/\/auth\/register$/),
          expect.objectContaining({ body: JSON.stringify(input) }),
        );
        expect(page.get("[role=alert]").text()).toBe(duplicateMessage);
      } finally {
        page.unmount();
      }
    },
  );

  it("shows the exact guidance for an email that is already registered", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 409,
          code: "EMAIL_ALREADY_REGISTERED",
          message:
            "Este e-mail já está cadastrado. Entre na sua conta ou solicite o reenvio da confirmação.",
        }),
        { status: 409 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const page = mount(RegisterPage);
    await page.get("#name").setValue("Ana");
    await page.get("#email").setValue("ana@example.com");
    await page.get("#password").setValue("same password");
    await page.get("form").trigger("submit");
    await flushPromises();

    expect(page.get("[role=alert]").text()).toBe(
      "Este e-mail já está cadastrado. Entre na sua conta ou solicite o reenvio da confirmação.",
    );
    expect(page.find("a").exists()).toBe(false);
    expect(page.findAll("button").map((button) => button.attributes("type"))).toEqual(["submit"]);
    page.unmount();
  });

  it("shows each API validation message by its field and preserves entries for correction", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(
        JSON.stringify({
          statusCode: 400,
          code: "VALIDATION_ERROR",
          message: "Verifique os campos informados.",
          details: {
            name: ["Informe um nome de 2 a 100 caracteres."],
            email: ["Informe um e-mail válido."],
          },
        }),
        { status: 400 },
      ))
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ data: { accountCreated: true, verificationEmailStatus: "accepted" } }),
        { status: 201 },
      ));
    vi.stubGlobal("fetch", fetchMock);
    const page = mount(RegisterPage, { attachTo: document.body });
    const values = {
      name: "",
      email: "email-invalido",
      password: " secret ",
      phone: "(42) 91234-5678",
    };
    for (const [field, value] of Object.entries(values)) {
      await page.get<HTMLInputElement>(`#${field}`).setValue(value);
    }
    page.get<HTMLButtonElement>("button[type=submit]").element.click();
    await flushPromises();

    for (const [field, message] of [
      ["name", "Informe um nome de 2 a 100 caracteres."],
      ["email", "Informe um e-mail válido."],
    ] as const) {
      const input = page.get(`#${field}`);
      const messageId = input.attributes("aria-describedby");
      expect(input.attributes("aria-invalid")).toBe("true");
      expect(page.get(`label[for=${field}] #${messageId}`).text()).toBe(message);
    }
    for (const [field, value] of Object.entries(values)) {
      expect(page.get<HTMLInputElement>(`#${field}`).element.value).toBe(value);
    }
    expect(page.get("#password").attributes("aria-invalid")).toBeUndefined();
    expect(page.get("#phone").attributes("aria-invalid")).toBeUndefined();
    await page.get("#name").setValue("Ana");
    await page.get("#email").setValue("ana@example.com");
    page.get<HTMLButtonElement>("button[type=submit]").element.click();
    await flushPromises();

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/auth\/register$/),
      expect.objectContaining({
        body: JSON.stringify({ ...values, name: "Ana", email: "ana@example.com" }),
      }),
    );
    expect(page.get("[role=status]").text()).toBe(
      "Conta criada. Confira seu e-mail para confirmar o cadastro.",
    );
    page.unmount();
  });

  it("discards an unsubmitted registration when the page is opened again", async () => {
    const draft = {
      name: "Ana",
      email: "ana@example.com",
      password: "same password",
      phone: "(42) 91234-5678",
    };
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    const storageWrite = vi.spyOn(Storage.prototype, "setItem");

    async function visitRegistration() {
      const router = createRouter({
        history: createMemoryHistory(),
        routes: existingRouter.options.routes,
      });
      await router.push("/criar-conta");
      await router.isReady();
      return mount(App, { global: { plugins: [router] } });
    }

    try {
      const firstVisit = await visitRegistration();
      try {
        for (const [field, value] of Object.entries(draft)) {
          await firstVisit.get(`#${field}`).setValue(value);
        }
        await flushPromises();
      } finally {
        firstVisit.unmount();
      }

      const nextVisit = await visitRegistration();
      try {
        await flushPromises();
        for (const field of Object.keys(draft)) {
          expect(nextVisit.get<HTMLInputElement>(`#${field}`).element.value).toBe("");
        }
      } finally {
        nextVisit.unmount();
      }

      expect(fetchMock).not.toHaveBeenCalled();
      expect(storageWrite).not.toHaveBeenCalled();
    } finally {
      storageWrite.mockRestore();
    }
  });

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
    expect(page.findAll("form input").map((input) => input.attributes("name"))).toEqual([
      "name",
      "email",
      "password",
      "phone",
    ]);
    expect(page.get('label[for="phone"]').text()).toBe("Celular (opcional)");
    expect(page.get("[name=phone]").attributes("required")).toBeUndefined();
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
