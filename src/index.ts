import { startSSEServer, startStdioServer } from "./mastra/mcp/mcp-server";

/**
 * Main entry point for the Kestra MCP Documentation Server
 * Decides which type of server to start based on the SERVER_TYPE environment variable
 */
const main = async (): Promise<void> => {
  // Get server type from environment variable, default to 'sse'
  const serverType = process.env.SERVER_TYPE?.toLowerCase() || "sse";

  // Get port from environment variable, default to 8080
  const port = parseInt(process.env.PORT || "8080", 10);

  if (serverType === "stdio") {
    await startStdioServer();
    console.log("Kestra Docs MCP Server started with stdio transport");
  } else {
    await startSSEServer(port);
    console.log(
      `Kestra Docs MCP Server started with SSE transport on port ${port}`
    );
  }
};

// Start the server
main().catch((error) => {
  console.error("Failed to start Kestra Docs MCP Server:", error);
  process.exit(1);
});
