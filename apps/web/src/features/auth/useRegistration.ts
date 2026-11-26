import { reactive, ref } from "vue";
import {
  EmailAlreadyRegisteredError,
  register,
  RegistrationOutcomeUnknownError,
  RegistrationValidationError,
  VerificationEmailUnconfirmedError,
  type RegistrationFieldErrors,
} from "./registration.service";

export function useRegistration() {
  const fields = reactive({ name: "", email: "", password: "", phone: "" });
  const errors = ref<RegistrationFieldErrors>({});
  const submittedEmail = ref("");
  const state = ref<
    | "idle"
    | "submitting"
    | "success"
    | "email-already-registered"
    | "email-unconfirmed"
    | "outcome-unknown"
    | "error"
  >("idle");
  async function submit() {
    if (
      state.value === "submitting" ||
      state.value === "success" ||
      state.value === "email-unconfirmed"
    ) return;
    errors.value = {};
    state.value = "submitting";
    const input = {
      name: fields.name,
      email: fields.email,
      password: fields.password,
      ...(fields.phone ? { phone: fields.phone } : {}),
    };
    try {
      await register(input);
      submittedEmail.value = input.email;
      fields.password = "";
      state.value = "success";
    } catch (error) {
      if (error instanceof RegistrationValidationError) {
        errors.value = error.fieldErrors;
        state.value = "idle";
      } else if (error instanceof EmailAlreadyRegisteredError) {
        state.value = "email-already-registered";
      } else if (error instanceof VerificationEmailUnconfirmedError) {
        submittedEmail.value = input.email;
        fields.password = "";
        state.value = "email-unconfirmed";
      } else if (error instanceof RegistrationOutcomeUnknownError) {
        state.value = "outcome-unknown";
      } else {
        state.value = "error";
      }
    }
  }
  return { fields, errors, state, submittedEmail, submit };
}
