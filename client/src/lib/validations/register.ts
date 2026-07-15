import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(1, "Every pirate needs a name!"),
    email: z.string().email("That Den Den Mushi address doesn't look right"),
    password: z.string().min(8, "Secret code must be at least 8 characters, captain!"),
    confirmPassword: z.string().min(1, "Confirm your secret code, nakama!"),
    avatar: z.string().nullable().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Codes don't match, nakama!",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
