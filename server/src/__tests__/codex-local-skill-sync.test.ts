import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listCodexSkills,
  syncCodexSkills,
} from "@bullpen/adapter-codex-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("codex local skill sync", () => {
  const bullpenKey = "bullpen/bullpen/bullpen";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured Bullpen skills for workspace injection on the next run", async () => {
    const codexHome = await makeTempDir("bullpen-codex-skill-sync-");
    cleanupDirs.add(codexHome);

    const ctx = {
      agentId: "agent-1",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        bullpenSkillSync: {
          desiredSkills: [bullpenKey],
        },
      },
    } as const;

    const before = await listCodexSkills(ctx);
    expect(before.mode).toBe("ephemeral");
    expect(before.desiredSkills).toContain(bullpenKey);
    expect(before.entries.find((entry) => entry.key === bullpenKey)?.state).toBe("configured");
    expect(before.entries.find((entry) => entry.key === bullpenKey)?.detail).toContain("CODEX_HOME/skills/");
  });

  it("does not persist Bullpen skills into CODEX_HOME during sync", async () => {
    const codexHome = await makeTempDir("bullpen-codex-skill-prune-");
    cleanupDirs.add(codexHome);

    const configuredCtx = {
      agentId: "agent-2",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        bullpenSkillSync: {
          desiredSkills: [bullpenKey],
        },
      },
    } as const;

    const after = await syncCodexSkills(configuredCtx, [bullpenKey]);
    expect(after.mode).toBe("ephemeral");
    expect(after.entries.find((entry) => entry.key === bullpenKey)?.state).toBe("configured");
    await expect(fs.lstat(path.join(codexHome, "skills", "bullpen"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("normalizes legacy flat Bullpen skill refs before reporting configured state", async () => {
    const codexHome = await makeTempDir("bullpen-codex-legacy-skill-sync-");
    cleanupDirs.add(codexHome);

    const snapshot = await listCodexSkills({
      agentId: "agent-3",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        bullpenSkillSync: {
          desiredSkills: ["bullpen"],
        },
      },
    });

    expect(snapshot.warnings).toEqual([]);
    expect(snapshot.desiredSkills).toContain(bullpenKey);
    expect(snapshot.desiredSkills).not.toContain("bullpen");
    expect(snapshot.entries.find((entry) => entry.key === bullpenKey)?.state).toBe("configured");
    expect(snapshot.entries.find((entry) => entry.key === "bullpen")).toBeUndefined();
  });
});
