import { describe, it, expect } from "bun:test";
import { parseHtmlToText } from "./monitor";

describe("parseHtmlToText", () => {
  it("strips tags and collapses whitespace", () => {
    const html = "<div><p>Hello&nbsp; <strong>world</strong>!</p><img src='x'></div>";
    const text = parseHtmlToText(html);
    expect(text).toBe("Hello world!");
  });

  it("handles empty and undefined", () => {
    expect(parseHtmlToText(undefined)).toBe("");
    expect(parseHtmlToText(""));
  });
});