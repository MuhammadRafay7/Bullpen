import fs from "node:fs";
import { bullpenConfigSchema, type BullpenConfig } from "@bullpen/shared";
import { ZodError } from "zod";
import { resolveBullpenConfigPath } from "./paths.js";

function formatConfigValidationError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const issuePath = issue.path.length > 0 ? issue.path.join(".") : "<root>";
      return `${issuePath}: ${issue.message}`;
    })
    .join("; ");
}

export function readConfigFile(): BullpenConfig | null {
  const configPath = resolveBullpenConfigPath();

  if (!fs.existsSync(configPath)) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid Bullpen config at ${configPath}: failed to read or parse JSON: ${reason}`);
  }

  try {
    return bullpenConfigSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Invalid Bullpen config at ${configPath}: ${formatConfigValidationError(error)}`);
    }

    throw error;
  }
}
