import "server-only";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CurrentUser } from "@/lib/auth/session";
import { registerMessagesTools } from "./tools/messages";

export const MCP_SERVER_NAME = "software-engineer-workspace";
export const MCP_SERVER_VERSION = "1.0.0";

/**
 * Builds a fresh MCP server with every domain's tools registered. Called
 * per-request by the HTTP transport (src/app/api/mcp/route.ts) since this
 * app runs stateless serverless functions — nothing here holds state across
 * requests, so a new instance per request is cheap and safe.
 *
 * `user` is resolved by the caller (from the request's session cookie)
 * before the transport starts processing messages — see the comment in
 * ./tools/messages.ts for why that resolution can't happen inside a tool
 * handler.
 */
export function createMcpServer(user: CurrentUser | null): McpServer {
  const server = new McpServer({ name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION });
  registerMessagesTools(server, user);
  return server;
}
