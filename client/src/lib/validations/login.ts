import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("That Den Den Mushi address doesn't look right"),
  password: z.string().min(1, "A pirate never forgets their secret code!"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
