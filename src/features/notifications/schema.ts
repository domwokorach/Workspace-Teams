import { z } from "zod";

export const markNotificationReadSchema = z.object({
  id: z.string().cuid().optional(),
  markAll: z.boolean().optional(),
});
