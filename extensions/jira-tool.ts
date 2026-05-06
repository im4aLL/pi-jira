import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Type } from "typebox";

type JsonRecord = Record<string, unknown>;

const extensionDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envFilePath = resolve(extensionDirectory, ".env");

let clientPromise: Promise<Client> | undefined;

/**
 * Registers Jira MCP bridge tools for pi.
 */
export default function registerJiraMcpExtension(pi: ExtensionAPI): void {
  loadExtensionEnv();

  pi.registerTool({
    name: "jira_mcp_list_tools",
    label: "Jira MCP List Tools",
    description: "List tools exposed by the configured private Jira MCP server.",
    promptSnippet: "List tools from the configured Jira MCP server.",
    promptGuidelines: [
      "Use jira_mcp_list_tools before jira_mcp_call_tool when the Jira MCP tool names are unknown.",
    ],
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, signal): Promise<unknown> {
      const client = await getClient(signal);
      const result = await client.listTools();

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        details: result,
      };
    },
  });

  pi.registerTool({
    name: "jira_mcp_call_tool",
    label: "Jira MCP Call Tool",
    description: "Call a tool exposed by the configured private Jira MCP server.",
    promptSnippet: "Call Jira MCP tools to fetch private Jira issues and acceptance criteria.",
    promptGuidelines: [
      "Use jira_mcp_call_tool to fetch Jira issue details only when the user asks to verify a Jira ticket or acceptance criteria.",
      "Do not use jira_mcp_call_tool to modify Jira unless the user explicitly asks.",
    ],
    parameters: Type.Object({
      name: Type.String({ description: "MCP tool name to call." }),
      arguments: Type.Optional(
        Type.Record(Type.String(), Type.Unknown(), {
          description: "Arguments to pass to the MCP tool.",
        }),
      ),
    }),
    async execute(_toolCallId, params, signal): Promise<unknown> {
      const client = await getClient(signal);
      const result = await client.callTool({
        name: params.name,
        arguments: (params.arguments ?? {}) as JsonRecord,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        details: result,
      };
    },
  });

  pi.registerCommand("jira-mcp-status", {
    description: "Check the configured Jira MCP server connection.",
    handler: async (_args, ctx): Promise<void> => {
      try {
        const client = await getClient(ctx.signal);
        const tools = await client.listTools();
        ctx.ui.notify(`Jira MCP connected. Tools: ${tools.tools.length}`, "success");
      } catch (error) {
        ctx.ui.notify(getErrorMessage(error), "error");
      }
    },
  });
}

/**
 * Lazily creates one MCP client per extension runtime.
 */
async function getClient(signal?: AbortSignal): Promise<Client> {
  clientPromise ??= createClient(signal);

  return clientPromise;
}

/**
 * Starts and connects to the configured stdio MCP server.
 */
async function createClient(signal?: AbortSignal): Promise<Client> {
  loadExtensionEnv();

  const command = process.env.JIRA_MCP_COMMAND ?? "npx";
  const args = process.env.JIRA_MCP_ARGS
    ? parseJsonArray(process.env.JIRA_MCP_ARGS, "JIRA_MCP_ARGS")
    : ["-y", "mcp-remote", "https://mcp.atlassian.com/v1/mcp"];
  const env = parseJsonObject(process.env.JIRA_MCP_ENV_JSON, "JIRA_MCP_ENV_JSON");
  const client = new Client({ name: "pi-jira-mcp", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command,
    args,
    env: { ...process.env, ...env } as Record<string, string>,
  });

  signal?.throwIfAborted();
  await client.connect(transport);

  return client;
}

/**
 * Loads extension-local environment variables without overwriting shell values.
 */
function loadExtensionEnv(): void {
  if (!existsSync(envFilePath)) {
    return;
  }

  const lines = readFileSync(envFilePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    setEnvLine(line);
  }
}

/**
 * Parses and applies one dotenv-style assignment.
 */
function setEnvLine(line: string): void {
  const trimmedLine = line.trim();

  if (!trimmedLine || trimmedLine.startsWith("#")) {
    return;
  }

  const separatorIndex = trimmedLine.indexOf("=");

  if (separatorIndex <= 0) {
    return;
  }

  const key = trimmedLine.slice(0, separatorIndex).trim();
  const value = unquoteEnvValue(trimmedLine.slice(separatorIndex + 1).trim());

  process.env[key] ??= value;
}

/**
 * Removes simple dotenv quotes from a value.
 */
function unquoteEnvValue(value: string): string {
  if (value.length < 2) {
    return value;
  }

  const firstCharacter = value[0];
  const lastCharacter = value[value.length - 1];

  if ((firstCharacter === '"' && lastCharacter === '"') || (firstCharacter === "'" && lastCharacter === "'")) {
    return value.slice(1, -1);
  }

  return value;
}

/**
 * Parses an optional JSON string array environment variable.
 */
function parseJsonArray(value: string | undefined, name: string): string[] {
  if (!value) {
    return [];
  }

  const parsed = JSON.parse(value) as unknown;

  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    throw new Error(`${name} must be a JSON string array.`);
  }

  return parsed;
}

/**
 * Parses an optional JSON object environment variable.
 */
function parseJsonObject(value: string | undefined, name: string): Record<string, string> {
  if (!value) {
    return {};
  }

  const parsed = JSON.parse(value) as unknown;

  if (!isStringRecord(parsed)) {
    throw new Error(`${name} must be a JSON object with string values.`);
  }

  return parsed;
}

/**
 * Checks whether a value is a string record.
 */
function isStringRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((item) => typeof item === "string");
}

/**
 * Formats unknown errors.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
