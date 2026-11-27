import { get, post, postWithoutContent } from "../../shared/http/client";

interface LoginInput {
  email: string;
  password: string;
}

export interface SessionProfile {
  id: string;
  name: string;
  role: "DEVELOPER" | "ADMIN";
}

let pendingLogout: Promise<void> | undefined;

function afterLogout<T>(request: () => Promise<T>): Promise<T> {
  // The logout response can clear the cookie used by either request.
  return pendingLogout ? pendingLogout.then(request, request) : request();
}

export function login(input: LoginInput): Promise<SessionProfile> {
  return afterLogout(() => post<SessionProfile>("/auth/login", input, { credentials: "include" }));
}

export function getSession(): Promise<SessionProfile> {
  return afterLogout(() => get<SessionProfile>("/auth/session", { credentials: "include" }));
}

export function logout(): Promise<void> {
  pendingLogout ??= postWithoutContent("/auth/logout", { credentials: "include" }).finally(() => {
    pendingLogout = undefined;
  });
  return pendingLogout;
}
