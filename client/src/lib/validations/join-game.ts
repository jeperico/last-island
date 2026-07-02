import { z } from "zod";

export const joinGameSchema = z.object({
  token: z.string().min(1, "Please enter a game token"),
});

export type JoinGameFormData = z.infer<typeof joinGameSchema>;
