import { HttpError, post } from "../../shared/http/client";

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

type RegistrationField = keyof RegistrationInput;
export type RegistrationFieldErrors = Partial<Record<RegistrationField, string>>;

export class RegistrationValidationError extends Error {
  constructor(readonly fieldErrors: RegistrationFieldErrors) {
    super("Verifique os campos informados.");
  }
}

export async function register(input: RegistrationInput): Promise<RegistrationResult> {
  try {
    return await post<RegistrationResult>("/auth/register", input);
  } catch (error) {
    if (error instanceof HttpError && error.statusCode === 400 && error.code === "VALIDATION_ERROR") {
      const details = error.details;
      if (typeof details === "object" && details !== null) {
        const fieldErrors: RegistrationFieldErrors = {};
        const fields = ["name", "email", "password", "phone"] as const;
        for (const field of fields) {
          const messages = (details as Partial<Record<RegistrationField, unknown>>)[field];
          if (Array.isArray(messages) && typeof messages[0] === "string") {
            fieldErrors[field] = messages[0];
          }
        }
        if (Object.keys(fieldErrors).length) throw new RegistrationValidationError(fieldErrors);
      }
    }
    throw error;
  }
}
