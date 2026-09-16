import { describe, it, expect } from "vitest";
import {
  listMessagesSchema,
  createMessageSchema,
  updateMessageSchema,
  searchMessagesSchema,
  markReadSchema,
} from "@/lib/validation/messages";

describe("listMessagesSchema", () => {
  it("requires channelId", () => {
    expect(() => listMessagesSchema.parse({})).toThrow();
  });

  it("defaults limit to 20 and accepts an omitted cursor", () => {
    const parsed = listMessagesSchema.parse({ channelId: "chan_1" });
    expect(parsed).toEqual({ channelId: "chan_1", limit: 20 });
  });

  it("rejects a limit above 100", () => {
    expect(() => listMessagesSchema.parse({ channelId: "chan_1", limit: 500 })).toThrow();
  });

  it("rejects a non-integer limit", () => {
    expect(() => listMessagesSchema.parse({ channelId: "chan_1", limit: 1.5 })).toThrow();
  });
});

describe("createMessageSchema", () => {
  it("rejects empty content", () => {
    expect(() => createMessageSchema.parse({ channelId: "chan_1", content: "   " })).toThrow();
  });

  it("rejects content over 4000 characters", () => {
    expect(() => createMessageSchema.parse({ channelId: "chan_1", content: "a".repeat(4001) })).toThrow();
  });

  it("accepts valid content with an optional threadId", () => {
    const parsed = createMessageSchema.parse({ channelId: "chan_1", content: "hello", threadId: "thread_1" });
    expect(parsed.content).toBe("hello");
    expect(parsed.threadId).toBe("thread_1");
  });
});

describe("updateMessageSchema", () => {
  it("requires both messageId and content", () => {
    expect(() => updateMessageSchema.parse({ messageId: "msg_1" })).toThrow();
    expect(() => updateMessageSchema.parse({ content: "hi" })).toThrow();
  });
});

describe("searchMessagesSchema", () => {
  it("allows every filter to be omitted", () => {
    expect(searchMessagesSchema.parse({})).toEqual({ limit: 20 });
  });

  it("rejects a malformed createdAfter date", () => {
    expect(() => searchMessagesSchema.parse({ createdAfter: "not-a-date" })).toThrow();
  });

  it("accepts a fully specified filter set", () => {
    const parsed = searchMessagesSchema.parse({
      channelId: "chan_1",
      senderId: "user_1",
      query: "deploy",
      read: false,
      createdAfter: "2026-01-01T00:00:00.000Z",
      createdBefore: "2026-02-01T00:00:00.000Z",
      limit: 10,
    });
    expect(parsed.query).toBe("deploy");
    expect(parsed.read).toBe(false);
  });
});

describe("markReadSchema", () => {
  it("requires channelId", () => {
    expect(() => markReadSchema.parse({})).toThrow();
  });

  it("accepts an optional upToMessageId", () => {
    expect(markReadSchema.parse({ channelId: "chan_1" })).toEqual({ channelId: "chan_1" });
    expect(markReadSchema.parse({ channelId: "chan_1", upToMessageId: "msg_1" })).toEqual({
      channelId: "chan_1",
      upToMessageId: "msg_1",
    });
  });
});
