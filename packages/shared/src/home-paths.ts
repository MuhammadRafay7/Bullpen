import os from "node:os";
import path from "node:path";

export const DEFAULT_BULLPEN_INSTANCE_ID = "default";
export const BULLPEN_CONFIG_BASENAME = "config.json";
export const BULLPEN_ENV_FILENAME = ".env";

const PATH_SEGMENT_RE = /^[a-zA-Z0-9_-]+$/;

export function expandHomePrefix(value: string): string {
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.resolve(os.homedir(), value.slice(2));
  return value;
}

export function resolveBullpenHomeDir(homeOverride?: string): string {
  const raw = homeOverride?.trim() || process.env.BULLPEN_HOME?.trim();
  if (raw) return path.resolve(expandHomePrefix(raw));
  return path.resolve(os.homedir(), ".bullpen");
}

export function resolveBullpenInstanceId(instanceIdOverride?: string): string {
  const raw = instanceIdOverride?.trim() || process.env.BULLPEN_INSTANCE_ID?.trim() || DEFAULT_BULLPEN_INSTANCE_ID;
  if (!PATH_SEGMENT_RE.test(raw)) {
    throw new Error(`Invalid BULLPEN_INSTANCE_ID '${raw}'.`);
  }
  return raw;
}

export function resolveBullpenInstanceRoot(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolveBullpenHomeDir(input.homeDir), "instances", resolveBullpenInstanceId(input.instanceId));
}

export function resolveBullpenInstanceConfigPath(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolveBullpenInstanceRoot(input), BULLPEN_CONFIG_BASENAME);
}

export function resolveBullpenConfigPathForInstance(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return resolveBullpenInstanceConfigPath(input);
}

export function resolveBullpenEnvPathForConfig(configPath: string): string {
  return path.resolve(path.dirname(configPath), BULLPEN_ENV_FILENAME);
}

export function resolveDefaultEmbeddedPostgresDir(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolveBullpenInstanceRoot(input), "db");
}

export function resolveDefaultLogsDir(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolveBullpenInstanceRoot(input), "logs");
}

export function resolveDefaultSecretsKeyFilePath(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolveBullpenInstanceRoot(input), "secrets", "master.key");
}

export function resolveDefaultStorageDir(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolveBullpenInstanceRoot(input), "data", "storage");
}

export function resolveDefaultBackupDir(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolveBullpenInstanceRoot(input), "data", "backups");
}

export function resolveHomeAwarePath(value: string): string {
  return path.resolve(expandHomePrefix(value));
}
