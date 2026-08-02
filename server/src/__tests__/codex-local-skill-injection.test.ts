import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ensureCodexSkillsInjected } from "@bullpen/adapter-codex-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function createBullpenRepoSkill(root: string, skillName: string) {
  await fs.mkdir(path.join(root, "server"), { recursive: true });
  await fs.mkdir(path.join(root, "packages", "adapter-utils"), { recursive: true });
  await fs.mkdir(path.join(root, "skills", skillName), { recursive: true });
  await fs.writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n", "utf8");
  await fs.writeFile(path.join(root, "package.json"), '{"name":"bullpen"}\n', "utf8");
  await fs.writeFile(
    path.join(root, "skills", skillName, "SKILL.md"),
    `---\nname: ${skillName}\n---\n`,
    "utf8",
  );
}

async function createCustomSkill(root: string, skillName: string) {
  await fs.mkdir(path.join(root, "custom", skillName), { recursive: true });
  await fs.writeFile(
    path.join(root, "custom", skillName, "SKILL.md"),
    `---\nname: ${skillName}\n---\n`,
    "utf8",
  );
}

describe("codex local adapter skill injection", () => {
  const bullpenKey = "bullpen/bullpen/bullpen";
  const createAgentKey = "bullpen/bullpen/bullpen-create-agent";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("repairs a Codex Bullpen skill symlink that still points at another live checkout", async () => {
    const currentRepo = await makeTempDir("bullpen-codex-current-");
    const oldRepo = await makeTempDir("bullpen-codex-old-");
    const skillsHome = await makeTempDir("bullpen-codex-home-");
    cleanupDirs.add(currentRepo);
    cleanupDirs.add(oldRepo);
    cleanupDirs.add(skillsHome);

    await createBullpenRepoSkill(currentRepo, "bullpen");
    await createBullpenRepoSkill(currentRepo, "bullpen-create-agent");
    await createBullpenRepoSkill(oldRepo, "bullpen");
    await fs.symlink(path.join(oldRepo, "skills", "bullpen"), path.join(skillsHome, "bullpen"));

    const logs: Array<{ stream: "stdout" | "stderr"; chunk: string }> = [];
    await ensureCodexSkillsInjected(
      async (stream, chunk) => {
        logs.push({ stream, chunk });
      },
      {
        skillsHome,
        skillsEntries: [
          {
            key: bullpenKey,
            runtimeName: "bullpen",
            source: path.join(currentRepo, "skills", "bullpen"),
          },
          {
            key: createAgentKey,
            runtimeName: "bullpen-create-agent",
            source: path.join(currentRepo, "skills", "bullpen-create-agent"),
          },
        ],
      },
    );

    expect(await fs.realpath(path.join(skillsHome, "bullpen"))).toBe(
      await fs.realpath(path.join(currentRepo, "skills", "bullpen")),
    );
    expect(await fs.realpath(path.join(skillsHome, "bullpen-create-agent"))).toBe(
      await fs.realpath(path.join(currentRepo, "skills", "bullpen-create-agent")),
    );
    expect(logs).toContainEqual(
      expect.objectContaining({
        stream: "stdout",
        chunk: expect.stringContaining('Repaired Codex skill "bullpen"'),
      }),
    );
    expect(logs).toContainEqual(
      expect.objectContaining({
        stream: "stdout",
        chunk: expect.stringContaining('Injected Codex skill "bullpen-create-agent"'),
      }),
    );
  });

  it("preserves a custom Codex skill symlink outside Bullpen repo checkouts", async () => {
    const currentRepo = await makeTempDir("bullpen-codex-current-");
    const customRoot = await makeTempDir("bullpen-codex-custom-");
    const skillsHome = await makeTempDir("bullpen-codex-home-");
    cleanupDirs.add(currentRepo);
    cleanupDirs.add(customRoot);
    cleanupDirs.add(skillsHome);

    await createBullpenRepoSkill(currentRepo, "bullpen");
    await createCustomSkill(customRoot, "bullpen");
    await fs.symlink(path.join(customRoot, "custom", "bullpen"), path.join(skillsHome, "bullpen"));

    await ensureCodexSkillsInjected(async () => {}, {
      skillsHome,
      skillsEntries: [{
        key: bullpenKey,
        runtimeName: "bullpen",
        source: path.join(currentRepo, "skills", "bullpen"),
      }],
    });

    expect(await fs.realpath(path.join(skillsHome, "bullpen"))).toBe(
      await fs.realpath(path.join(customRoot, "custom", "bullpen")),
    );
  });

  it("prunes broken symlinks for unavailable Bullpen repo skills before Codex starts", async () => {
    const currentRepo = await makeTempDir("bullpen-codex-current-");
    const oldRepo = await makeTempDir("bullpen-codex-old-");
    const skillsHome = await makeTempDir("bullpen-codex-home-");
    cleanupDirs.add(currentRepo);
    cleanupDirs.add(oldRepo);
    cleanupDirs.add(skillsHome);

    await createBullpenRepoSkill(currentRepo, "bullpen");
    await createBullpenRepoSkill(oldRepo, "agent-browser");
    const staleTarget = path.join(oldRepo, "skills", "agent-browser");
    await fs.symlink(staleTarget, path.join(skillsHome, "agent-browser"));
    await fs.rm(staleTarget, { recursive: true, force: true });

    const logs: Array<{ stream: "stdout" | "stderr"; chunk: string }> = [];
    await ensureCodexSkillsInjected(
      async (stream, chunk) => {
        logs.push({ stream, chunk });
      },
      {
        skillsHome,
        skillsEntries: [{
          key: bullpenKey,
          runtimeName: "bullpen",
          source: path.join(currentRepo, "skills", "bullpen"),
        }],
      },
    );

    await expect(fs.lstat(path.join(skillsHome, "agent-browser"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(logs).toContainEqual(
      expect.objectContaining({
        stream: "stdout",
        chunk: expect.stringContaining('Removed stale Codex skill "agent-browser"'),
      }),
    );
  });

  it("preserves other live Bullpen skill symlinks in the shared workspace skill directory", async () => {
    const currentRepo = await makeTempDir("bullpen-codex-current-");
    const skillsHome = await makeTempDir("bullpen-codex-home-");
    cleanupDirs.add(currentRepo);
    cleanupDirs.add(skillsHome);

    await createBullpenRepoSkill(currentRepo, "bullpen");
    await createBullpenRepoSkill(currentRepo, "agent-browser");
    await fs.symlink(
      path.join(currentRepo, "skills", "agent-browser"),
      path.join(skillsHome, "agent-browser"),
    );

    await ensureCodexSkillsInjected(async () => {}, {
      skillsHome,
      skillsEntries: [{
        key: bullpenKey,
        runtimeName: "bullpen",
        source: path.join(currentRepo, "skills", "bullpen"),
      }],
    });

    expect((await fs.lstat(path.join(skillsHome, "bullpen"))).isSymbolicLink()).toBe(true);
    expect((await fs.lstat(path.join(skillsHome, "agent-browser"))).isSymbolicLink()).toBe(true);
    expect(await fs.realpath(path.join(skillsHome, "agent-browser"))).toBe(
      await fs.realpath(path.join(currentRepo, "skills", "agent-browser")),
    );
  });
});
