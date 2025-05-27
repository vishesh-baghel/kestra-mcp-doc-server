import { createTool } from "@mastra/core/tools";
import { DocQuerySchema, DocResultSchema } from "../types/docs";

// Mock data for demonstration - in a real implementation, this would be fetched from actual docs
const mockKestraDocs = [
  {
    path: "introduction.md",
    content:
      "Kestra is an open-source orchestration and scheduling platform...",
    metadata: {
      title: "Introduction to Kestra",
      category: "getting-started",
      version: "1.0.0",
      lastUpdated: "2023-10-15",
    },
  },
  {
    path: "workflows/basics.md",
    content: "Kestra workflows are defined as code using YAML...",
    metadata: {
      title: "Workflow Basics",
      category: "workflows",
      version: "1.0.0",
      lastUpdated: "2023-10-20",
    },
  },
  {
    path: "plugins/overview.md",
    content: "Kestra plugins extend the functionality of the core platform...",
    metadata: {
      title: "Plugins Overview",
      category: "plugins",
      version: "1.0.0",
      lastUpdated: "2023-10-18",
    },
  },
];

/**
 * Tool for fetching Kestra documentation
 */
export const kestraDocsSearchTool = createTool({
  id: "kestra-docs-search",
  description:
    "Search Kestra documentation to find answers about Kestra functionality, workflows, plugins, and more",
  inputSchema: DocQuerySchema,
  outputSchema: DocResultSchema,
  execute: async ({ context: { query, filter } }) => {
    console.log(`Searching Kestra docs for: ${query}`);

    // In a real implementation, this would search through actual documentation
    // For now, we're using mock data and simple search
    let filteredDocs = [...mockKestraDocs];

    // Apply filters if provided
    if (filter?.category) {
      const categoryFilter = filter.category;
      filteredDocs = filteredDocs.filter(
        (doc) =>
          doc.metadata.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (filter?.version) {
      filteredDocs = filteredDocs.filter(
        (doc) => doc.metadata.version === filter.version
      );
    }

    // Search by query (simple contains for demo purposes)
    const results = filteredDocs.filter(
      (doc) =>
        doc.content.toLowerCase().includes(query.toLowerCase()) ||
        doc.path.toLowerCase().includes(query.toLowerCase()) ||
        doc.metadata.title?.toLowerCase().includes(query.toLowerCase())
    );

    if (results.length === 0) {
      // Return a not found message
      return {
        content: `No documentation found for query: ${query}`,
        path: "not-found",
        metadata: {
          title: "Not Found",
          category: "error",
          version: "1.0.0",
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    // Return the first matching result
    // In a real implementation, you might want to return all results or the best match
    return results[0];
  },
});

/**
 * Tool for retrieving a specific Kestra documentation page by path
 */
export const kestraDocsPathTool = createTool({
  id: "kestra-docs-by-path",
  description: "Retrieve a specific Kestra documentation page by its path",
  inputSchema: DocQuerySchema,
  outputSchema: DocResultSchema,
  execute: async ({ context: { query } }) => {
    console.log(`Fetching Kestra docs by path: ${query}`);

    // In a real implementation, this would fetch the document by path
    const result = mockKestraDocs.find((doc) => doc.path === query);

    if (!result) {
      return {
        content: `No documentation found at path: ${query}`,
        path: "not-found",
        metadata: {
          title: "Not Found",
          category: "error",
          version: "1.0.0",
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    return result;
  },
});
