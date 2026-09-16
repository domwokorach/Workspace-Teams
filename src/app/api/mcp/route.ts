import { getCurrentUser } from "@/lib/auth/session";
import { createMcpServer } from "@/server/mcp/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

/**
 * MCP Streamable HTTP endpoint. Stateless: each request gets its own
 * McpServer + transport pair. The session cookie is resolved here, before
 * the transport takes over message handling, because the MCP SDK's
 * internal dispatch loop does not preserve Next's per-request
 * AsyncLocalStorage context — calling `cookies()` (via `getCurrentUser`)
 * from inside a tool handler throws "cookies was called outside a request
 * scope". Resolving it up front reuses the app's existing cookie-based
 * session system while sidestepping that.
 */
async function handleMcpRequest(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  const server = createMcpServer(user);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    await server.close();
  }
}

export const POST = handleMcpRequest;
export const GET = handleMcpRequest;
export const DELETE = handleMcpRequest;
