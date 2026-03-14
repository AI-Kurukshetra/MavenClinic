import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address.").trim(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  next: z.string().optional(),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  email: z.email("Enter a valid email address.").trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[a-z]/, "Include at least one lowercase letter.")
    .regex(/[A-Z]/, "Include at least one uppercase letter.")
    .regex(/[0-9]/, "Include at least one number."),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address.").trim(),
});

export function getPasswordStrength(password: string) {
  if (!password) {
    return { score: 0, label: "", normalizedScore: 0 };
  }

  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
    score += 1;
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  }

  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) {
    score += 1;
  }

  const label = ["", "Weak", "Fair", "Good", "Strong"][score] ?? "Strong";

  return {
    score,
    label,
    normalizedScore: Math.max(1, score),
  };
}