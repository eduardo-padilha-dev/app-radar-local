import { reactive, ref } from "vue";
import { register } from "./registration.service";

export function useRegistration() {
  const fields = reactive({ name: "", email: "", password: "", phone: "" });
  const errors = ref<Record<string, string>>({});
  const state = ref<"idle" | "submitting" | "success" | "email-unconfirmed" | "error">("idle");
  async function submit() {
    if (state.value === "submitting" || state.value === "success") return;
    state.value = "submitting";
    try {
      const input = {
        name: fields.name,
        email: fields.email,
        password: fields.password,
        ...(fields.phone ? { phone: fields.phone } : {}),
      };
      await register(input);
      fields.password = "";
      state.value = "success";
    } catch {
      state.value = "error";
    }
  }
  return { fields, errors, state, submit };
}
