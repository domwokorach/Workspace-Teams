import { z } from "zod";

export const startCodingSessionSchema = z.object({
  repositoryId: z.string().cuid(),
  filePath: z.string().min(1),
});
