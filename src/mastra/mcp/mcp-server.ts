import { MCPServer } from "@mastra/mcp";
import { kestraDocsSearchTool, kestraDocsPathTool } from "../tools/docs-tool";
import { createServer } from "http";
import { IncomingMessage, ServerResponse } from "http";
// For SSE we need to use the startSSE method directly on the MCPServer

/**
 * Creates and configures the MCP Server for Kestra documentation
 */
export const createKestraMCPServer = () => {
  // Create the MCP Server
  const server = new MCPServer({
    name: "Kestra Documentation Server",
    version: "1.0.0",
    tools: {
      kestraDocsSearchTool,
      kestraDocsPathTool,
    },
  });

  return server;
};

/**
 * Starts an MCP server with stdio transport
 * This is useful for local development and CLI tools
 */
export const startStdioServer = async () => {
  const server = createKestraMCPServer();
  console.log("Starting Kestra Docs MCP Server with stdio transport...");
  await server.startStdio();
  return server;
};

/**
 * Starts an MCP server with SSE transport over HTTP
 * This is useful for web-based clients
 * @param port The port to listen on
 */
export const startSSEServer = async (port: number = 8080) => {
  const server = createKestraMCPServer();
  console.log(
    `Starting Kestra Docs MCP Server with SSE transport on port ${port}...`
  );

  // Create an HTTP server to handle the SSE connections
  const httpServer = createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);

      // Handle SSE connections and messages using the MCPServer's startSSE method
      if (url.pathname === "/sse") {
        console.log("Received SSE connection");
        await server.startSSE({
          url: url,
          ssePath: "/sse",
          messagePath: "/message",
          req,
          res,
        });

        // Handle client disconnection
        res.on("close", () => {
          console.log("SSE connection closed");
        });
      }
      // Handle messages sent to the server
      else if (url.pathname === "/message") {
        console.log("Received message");
        // The message handling is managed by startSSE when it's called with the message request
        await server.startSSE({
          url: url,
          ssePath: "/sse",
          messagePath: "/message",
          req,
          res,
        });
      }
      // Return a simple status page for the root
      else if (url.pathname === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
        <html>
          <head>
            <title>Kestra Docs MCP Server</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              h1 { color: #2c3e50; }
              .status { padding: 10px; background-color: #e8f5e9; border-radius: 4px; }
              .tools { margin-top: 20px; }
              .tool { background-color: #f5f5f5; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
            </style>
          </head>
          <body>
            <h1>Kestra Documentation MCP Server</h1>
            <div class="status">
              <p>Server Status: Running</p>
              <p>SSE Endpoint: <code>/sse</code></p>
              <p>Message Endpoint: <code>/message</code></p>
            </div>
            <div class="tools">
              <h2>Available Tools:</h2>
              <div class="tool">
                <h3>kestra-docs-search</h3>
                <p>Search Kestra documentation to find answers about Kestra functionality, workflows, plugins, and more</p>
              </div>
              <div class="tool">
                <h3>kestra-docs-by-path</h3>
                <p>Retrieve a specific Kestra documentation page by its path</p>
              </div>
            </div>
          </body>
        </html>
      `);
      }
      // Handle unknown paths
      else {
        res.writeHead(404);
        res.end("Not Found");
      }
    }
  );

  // Start the HTTP server
  httpServer.listen(port, () => {
    console.log(
      `Kestra Docs MCP Server is running at http://localhost:${port}`
    );
  });

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("Shutting down Kestra Docs MCP Server...");
    // Close the MCP server
    await server.close();

    // Close the HTTP server
    httpServer.close(() => {
      console.log("Kestra Docs MCP Server shut down complete");
      process.exit(0);
    });
  });

  return { server, httpServer };
};
