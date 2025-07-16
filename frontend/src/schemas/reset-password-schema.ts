import * as z from "zod";

export const resetPasswordSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });
