import { get, post } from "../../shared/http/client";

interface LoginInput {
  email: string;
  password: string;
}

export interface SessionProfile {
  id: string;
  name: string;
  role: "DEVELOPER" | "ADMIN";
}

export function login(input: LoginInput): Promise<SessionProfile> {
  return post<SessionProfile>("/auth/login", input, { credentials: "include" });
}

export function getSession(): Promise<SessionProfile> {
  return get<SessionProfile>("/auth/session", { credentials: "include" });
}
