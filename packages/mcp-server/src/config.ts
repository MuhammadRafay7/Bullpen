export interface BullpenMcpConfig {
  apiUrl: string;
  apiKey: string;
  companyId: string | null;
  agentId: string | null;
  runId: string | null;
}

function nonEmpty(value: string | undefined): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function normalizeApiUrl(apiUrl: string): string {
  const trimmed = stripTrailingSlash(apiUrl.trim());
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export function readConfigFromEnv(env: NodeJS.ProcessEnv = process.env): BullpenMcpConfig {
  const apiUrl = nonEmpty(env.BULLPEN_API_URL);
  if (!apiUrl) {
    throw new Error("Missing BULLPEN_API_URL");
  }
  const apiKey = nonEmpty(env.BULLPEN_API_KEY);
  if (!apiKey) {
    throw new Error("Missing BULLPEN_API_KEY");
  }

  return {
    apiUrl: normalizeApiUrl(apiUrl),
    apiKey,
    companyId: nonEmpty(env.BULLPEN_COMPANY_ID),
    agentId: nonEmpty(env.BULLPEN_AGENT_ID),
    runId: nonEmpty(env.BULLPEN_RUN_ID),
  };
}
