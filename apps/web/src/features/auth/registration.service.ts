import { post } from "../../shared/http/client";

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}
export interface RegistrationResult {
  accountCreated: true;
  verificationEmailStatus: "accepted";
}
export async function register(input: RegistrationInput): Promise<RegistrationResult> {
  return post<RegistrationResult>("/auth/register", input);
}
