import { describe, expect, it } from "vitest";
import { sanitizeInheritedBullpenEnv } from "./server-utils.js";

describe("sanitizeInheritedBullpenEnv", () => {
  it("drops the host-only Bullpen CLI command pointer", () => {
    expect(sanitizeInheritedBullpenEnv({
      BULLPEN_CMD: "node /missing/bullpen/dist/index.js",
      BULLPEN_RUNTIME_API_URL: "http://127.0.0.1:3100",
      PATH: "/usr/bin",
    })).toEqual({
      BULLPEN_RUNTIME_API_URL: "http://127.0.0.1:3100",
      PATH: "/usr/bin",
    });
  });
});
