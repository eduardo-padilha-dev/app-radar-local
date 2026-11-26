import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { login } from "./session.service";

const loginError = "Não foi possível entrar na sua conta.";

export function useLogin() {
  const router = useRouter();
  const fields = reactive({ email: "", password: "" });
  const submitting = ref(false);
  const error = ref("");

  async function submit() {
    if (submitting.value) return;
    error.value = "";
    submitting.value = true;
    try {
      await login({ email: fields.email, password: fields.password });
      fields.password = "";
      await router.replace({ name: "private-area" });
      if (router.currentRoute.value.name === "login") {
        error.value = loginError;
      }
    } catch {
      error.value = loginError;
    } finally {
      submitting.value = false;
    }
  }

  return { fields, submitting, error, submit };
}
