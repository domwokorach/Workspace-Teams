import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very weak" | "Weak" | "Fair" | "Strong" | "Very strong";
  issues: string[];
}

export function scorePasswordStrength(password: string): PasswordStrength {
  const issues: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else issues.push("At least 8 characters");

  if (password.length >= 12) score++;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else issues.push("Mix of upper and lowercase letters");

  if (/\d/.test(password)) score++;
  else issues.push("At least one number");

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else issues.push("At least one symbol");

  const clamped = Math.min(4, Math.max(0, score - 1)) as 0 | 1 | 2 | 3 | 4;
  const labels: PasswordStrength["label"][] = [
    "Very weak",
    "Weak",
    "Fair",
    "Strong",
    "Very strong",
  ];

  return { score: clamped, label: labels[clamped], issues };
}
