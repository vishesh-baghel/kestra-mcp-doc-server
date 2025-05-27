import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";

import { kestraDocsAgent } from "./agents/kestra-docs-agent";
import { createKestraMCPServer } from "./mcp/mcp-server";

export const mastra = new Mastra({
  agents: {
    kestraDocsAgent,
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  mcpServers: {
    kestraDocs: createKestraMCPServer(),
  },
});
