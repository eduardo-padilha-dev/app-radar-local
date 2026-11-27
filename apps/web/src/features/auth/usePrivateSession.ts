import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { HttpError } from "../../shared/http/client";
import { getSession, type SessionProfile } from "./session.service";

type SessionState =
  | { status: "verified"; profile: SessionProfile }
  | { status: "checking" }
  | { status: "failed" };

export function usePrivateSession(initialProfile: SessionProfile) {
  const router = useRouter();
  const state = ref<SessionState>({ status: "verified", profile: initialProfile });
  let isMounted = false;

  function isPrivateAreaActive() {
    return isMounted && router.currentRoute.value.name === "private-area";
  }

  async function revalidateSession() {
    if (state.value.status === "checking") return;
    state.value = { status: "checking" };

    try {
      const profile = await getSession();
      if (isPrivateAreaActive()) state.value = { status: "verified", profile };
    } catch (error) {
      if (!isPrivateAreaActive()) return;
      if (error instanceof HttpError && error.statusCode === 401) {
        // The private area must offer a retry if navigation leaves it active.
        await router.replace({ name: "login" }).catch(() => undefined);
      }
      if (isPrivateAreaActive()) state.value = { status: "failed" };
    }
  }

  onMounted(() => {
    isMounted = true;
    window.addEventListener("focus", revalidateSession);
  });

  onUnmounted(() => {
    isMounted = false;
    window.removeEventListener("focus", revalidateSession);
  });

  return { state, revalidateSession };
}
