import { reactive, ref } from "vue";
import {
  EmailAlreadyRegisteredError,
  register,
  RegistrationValidationError,
  type RegistrationFieldErrors,
} from "./registration.service";

export function useRegistration() {
  const fields = reactive({ name: "", email: "", password: "", phone: "" });
  const errors = ref<RegistrationFieldErrors>({});
  const state = ref<
    "idle" | "submitting" | "success" | "email-already-registered" | "email-unconfirmed" | "error"
  >("idle");
  async function submit() {
    if (state.value === "submitting" || state.value === "success") return;
    errors.value = {};
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
    } catch (error) {
      if (error instanceof RegistrationValidationError) {
        errors.value = error.fieldErrors;
        state.value = "idle";
      } else if (error instanceof EmailAlreadyRegisteredError) {
        state.value = "email-already-registered";
      } else {
        state.value = "error";
      }
    }
  }
  return { fields, errors, state, submit };
}
