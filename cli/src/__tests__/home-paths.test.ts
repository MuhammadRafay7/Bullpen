import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  describeLocalInstancePaths,
  expandHomePrefix,
  resolveBullpenHomeDir,
  resolveBullpenInstanceId,
} from "../config/home.js";

const ORIGINAL_ENV = { ...process.env };

describe("home path resolution", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("defaults to ~/.bullpen and default instance", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "bullpen-home-paths-"));
    process.env.BULLPEN_HOME = home;
    delete process.env.BULLPEN_INSTANCE_ID;

    const paths = describeLocalInstancePaths();
    expect(paths.homeDir).toBe(home);
    expect(paths.instanceId).toBe("default");
    expect(paths.configPath).toBe(path.resolve(home, "instances", "default", "config.json"));
  });

  it("supports BULLPEN_HOME and explicit instance ids", () => {
    process.env.BULLPEN_HOME = "~/bullpen-home";

    const home = resolveBullpenHomeDir();
    expect(home).toBe(path.resolve(os.homedir(), "bullpen-home"));
    expect(resolveBullpenInstanceId("dev_1")).toBe("dev_1");
  });

  it("rejects invalid instance ids", () => {
    expect(() => resolveBullpenInstanceId("bad/id")).toThrow(/Invalid BULLPEN_INSTANCE_ID/);
  });

  it("expands ~ prefixes", () => {
    expect(expandHomePrefix("~")).toBe(os.homedir());
    expect(expandHomePrefix("~/x/y")).toBe(path.resolve(os.homedir(), "x/y"));
  });
});
