import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your secret code"),
    filiation: z.enum(["PIRATE", "MARINE"], {
      message: "Choose your filiation",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Codes don't match, nakama!",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
