import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { BullpenApiClient } from "./client.js";
import { readConfigFromEnv, type BullpenMcpConfig } from "./config.js";
import { createToolDefinitions } from "./tools.js";

export function createBullpenMcpServer(config: BullpenMcpConfig = readConfigFromEnv()) {
  const server = new McpServer({
    name: "bullpen",
    version: "0.1.0",
  });

  const client = new BullpenApiClient(config);
  const tools = createToolDefinitions(client);
  for (const tool of tools) {
    server.tool(tool.name, tool.description, tool.schema.shape, tool.execute);
  }

  return {
    server,
    tools,
    client,
  };
}

export async function runServer(config: BullpenMcpConfig = readConfigFromEnv()) {
  const { server } = createBullpenMcpServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
