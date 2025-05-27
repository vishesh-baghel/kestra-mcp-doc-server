import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { MCPClient } from '@mastra/mcp';

/**
 * MCPClient configuration for connecting to our local Kestra docs MCP server
 */
const mcp = new MCPClient({
  servers: {
    kestraDocs: {
      // For local development, connect to the local SSE server
      url: new URL('http://localhost:8080/sse'),
    },
  },
});

/**
 * Kestra documentation agent that connects to our MCP server
 */
export const kestraDocsAgent = new Agent({
  name: 'Kestra Documentation Agent',
  instructions: `
    You are a helpful assistant specialized in Kestra orchestration platform documentation.
    
    Your primary function is to help users understand Kestra concepts, features, and how to use the platform. When responding:
    - Always provide accurate information based on the official Kestra documentation
    - Include code examples when relevant to help users implement solutions
    - Explain complex topics in a clear, concise manner
    - If you don't know the answer, clearly state so rather than guessing
    - When appropriate, suggest related topics that might be helpful to the user
    
    Use the kestraDocsSearchTool to find relevant documentation based on user queries, and
    use the kestraDocsPathTool when you need to reference a specific documentation page.
  `,
  model: openai('gpt-4o-mini'),
  tools: async () => {
    // Fetch tools from the MCP server
    const toolsets = await mcp.getToolsets();
    return toolsets.kestraDocs || {};
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});
