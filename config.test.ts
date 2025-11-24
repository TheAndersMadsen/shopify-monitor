import { describe, it, expect } from "bun:test";
import { ConfigSchema } from "./config";

describe("ConfigSchema", () => {
  it("accepts valid config", () => {
    const result = ConfigSchema.safeParse({
      sites: ["https://kith.com"],
      webhookUrl: "",
      delayMs: 60000,
      userAgent: "UA"
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL and small delay", () => {
    const result = ConfigSchema.safeParse({
      sites: ["notaurl"],
      webhookUrl: "http://discord.com/webhook",
      delayMs: 1000,
      userAgent: "UA"
    });
    expect(result.success).toBe(false);
  });
});