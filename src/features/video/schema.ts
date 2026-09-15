import { z } from "zod";

export const createVideoRoomSchema = z.object({
  workspaceId: z.string().cuid(),
  name: z.string().min(1).max(120),
});
