import { createRouter, createWebHistory } from "vue-router";
import { getSession, type SessionProfile } from "../../features/auth/session.service";
import { HttpError } from "../../shared/http/client";

declare module "vue-router" {
  interface RouteMeta {
    sessionProfile?: SessionProfile;
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../../views/HomeView.vue"),
    },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../../views/AboutView.vue"),
    },
    {
      path: "/entrar",
      name: "login",
      component: () => import("../../features/auth/LoginPage.vue"),
    },
    {
      path: "/area-privada",
      name: "private-area",
      component: () => import("../../features/auth/PrivateAreaPage.vue"),
      props: (route) => ({ profile: route.meta.sessionProfile }),
      beforeEnter: async (to) => {
        try {
          to.meta.sessionProfile = await getSession();
        } catch (error) {
          if (error instanceof HttpError && error.statusCode === 401) {
            return { name: "login", replace: true };
          }
          throw error;
        }
      },
    },
    {
      path: "/criar-conta",
      name: "register",
      component: () => import("../../features/auth/RegisterPage.vue"),
    },
    {
      path: "/confirmar-email",
      name: "verify-email",
      component: () => import("../../features/auth/VerifyEmailPage.vue"),
    },
  ],
});

export default router;
