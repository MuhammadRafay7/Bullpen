import fs from "node:fs";
import path from "node:path";
import { resolveDefaultConfigPath } from "./home-paths.js";

const BULLPEN_CONFIG_BASENAME = "config.json";
const BULLPEN_ENV_FILENAME = ".env";

function findConfigFileFromAncestors(startDir: string): string | null {
  const absoluteStartDir = path.resolve(startDir);
  let currentDir = absoluteStartDir;

  while (true) {
    const candidate = path.resolve(currentDir, ".bullpen", BULLPEN_CONFIG_BASENAME);
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const nextDir = path.resolve(currentDir, "..");
    if (nextDir === currentDir) break;
    currentDir = nextDir;
  }

  return null;
}

export function resolveBullpenConfigPath(overridePath?: string): string {
  if (overridePath) return path.resolve(overridePath);
  if (process.env.BULLPEN_CONFIG) return path.resolve(process.env.BULLPEN_CONFIG);
  return findConfigFileFromAncestors(process.cwd()) ?? resolveDefaultConfigPath();
}

export function resolveBullpenEnvPath(overrideConfigPath?: string): string {
  return path.resolve(path.dirname(resolveBullpenConfigPath(overrideConfigPath)), BULLPEN_ENV_FILENAME);
}
