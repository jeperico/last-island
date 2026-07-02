import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  filiation: z.enum(["PIRATE", "MARINE"], {
    message: "Choose your filiation",
  }),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
