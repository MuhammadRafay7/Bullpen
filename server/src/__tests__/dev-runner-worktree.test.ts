import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  bootstrapDevRunnerWorktreeEnv,
  isLinkedGitWorktreeCheckout,
  resolveWorktreeEnvFilePath,
} from "../dev-runner-worktree.ts";

const tempRoots = new Set<string>();

afterEach(() => {
  for (const root of tempRoots) {
    fs.rmSync(root, { recursive: true, force: true });
  }
  tempRoots.clear();
});

function createTempRoot(prefix: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempRoots.add(root);
  return root;
}

describe("dev-runner worktree env bootstrap", () => {
  it("detects linked git worktrees from .git files", () => {
    const root = createTempRoot("bullpen-dev-runner-worktree-");
    fs.writeFileSync(path.join(root, ".git"), "gitdir: /tmp/bullpen/.git/worktrees/feature\n", "utf8");

    expect(isLinkedGitWorktreeCheckout(root)).toBe(true);
  });

  it("loads repo-local Bullpen env for initialized worktrees without overriding explicit env", () => {
    const root = createTempRoot("bullpen-dev-runner-worktree-env-");
    fs.mkdirSync(path.join(root, ".bullpen"), { recursive: true });
    fs.writeFileSync(path.join(root, ".git"), "gitdir: /tmp/bullpen/.git/worktrees/feature\n", "utf8");
    fs.writeFileSync(
      resolveWorktreeEnvFilePath(root),
      [
        "BULLPEN_HOME=/tmp/bullpen-worktrees",
        "BULLPEN_INSTANCE_ID=feature-worktree",
        "BULLPEN_IN_WORKTREE=true",
        "BULLPEN_WORKTREE_NAME=feature-worktree",
        "BULLPEN_OPTIONAL= # comment-only value",
        "",
      ].join("\n"),
      "utf8",
    );

    const env: NodeJS.ProcessEnv = {
      BULLPEN_INSTANCE_ID: "already-set",
    };
    const result = bootstrapDevRunnerWorktreeEnv(root, env);

    expect(result).toEqual({
      envPath: resolveWorktreeEnvFilePath(root),
      missingEnv: false,
    });
    expect(env.BULLPEN_HOME).toBe("/tmp/bullpen-worktrees");
    expect(env.BULLPEN_INSTANCE_ID).toBe("already-set");
    expect(env.BULLPEN_IN_WORKTREE).toBe("true");
    expect(env.BULLPEN_OPTIONAL).toBe("");
  });

  it("repairs stale migrated config paths before loading worktree env", () => {
    const root = createTempRoot("bullpen-dev-runner-worktree-migrated-env-");
    const localConfigPath = path.join(root, ".bullpen", "config.json");
    const worktreesDir = path.join(root, ".bullpen-worktrees");
    fs.mkdirSync(path.dirname(localConfigPath), { recursive: true });
    fs.writeFileSync(path.join(root, ".git"), "gitdir: /tmp/bullpen/.git/worktrees/feature\n", "utf8");
    fs.writeFileSync(localConfigPath, "{}\n", "utf8");
    fs.writeFileSync(
      resolveWorktreeEnvFilePath(root),
      [
        "BULLPEN_HOME=/old/home/.bullpen-worktrees",
        "BULLPEN_INSTANCE_ID=feature-worktree",
        "BULLPEN_CONFIG=/old/home/bullpen/.bullpen/worktrees/feature/.bullpen/config.json",
        "BULLPEN_CONTEXT=/old/home/.bullpen-worktrees/context.json",
        "BULLPEN_IN_WORKTREE=true",
        "BULLPEN_WORKTREE_NAME=feature-worktree",
        "",
      ].join("\n"),
      "utf8",
    );

    const env: NodeJS.ProcessEnv = {
      BULLPEN_WORKTREES_DIR: worktreesDir,
    };
    const result = bootstrapDevRunnerWorktreeEnv(root, env);

    expect(result).toEqual({
      envPath: resolveWorktreeEnvFilePath(root),
      missingEnv: false,
    });
    expect(env.BULLPEN_HOME).toBe(worktreesDir);
    expect(env.BULLPEN_CONFIG).toBe(localConfigPath);
    expect(env.BULLPEN_CONTEXT).toBe(path.join(worktreesDir, "context.json"));
    expect(env.BULLPEN_INSTANCE_ID).toBe("feature-worktree");
  });

  it("reports uninitialized linked worktrees so dev runner can fail fast", () => {
    const root = createTempRoot("bullpen-dev-runner-worktree-missing-");
    fs.writeFileSync(path.join(root, ".git"), "gitdir: /tmp/bullpen/.git/worktrees/feature\n", "utf8");

    expect(bootstrapDevRunnerWorktreeEnv(root, {})).toEqual({
      envPath: resolveWorktreeEnvFilePath(root),
      missingEnv: true,
    });
  });
});
