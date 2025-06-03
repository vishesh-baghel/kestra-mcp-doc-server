import { createTool } from "@mastra/core/tools";
import { DocQuerySchema, DocResultSchema } from "../types/docs";
import axios from "axios";
import * as cheerio from "cheerio";

// Base URL for Kestra documentation
const KESTRA_DOCS_BASE_URL = "https://kestra.io/docs";

/**
 * Fetches documentation content from Kestra website
 * @param path The path to the documentation
 * @returns Promise resolving to the document content, title, and metadata
 */
async function fetchKestraDoc(path: string) {
  try {
    // Build the full URL to the documentation
    let url = path;
    if (!url.startsWith("http")) {
      url = `${KESTRA_DOCS_BASE_URL}/${path.replace(/^\//, "")}`;
    }

    console.log(`Fetching document from: ${url}`);

    // Fetch the HTML content
    const response = await axios.get(url);
    const html = response.data;

    // Parse the HTML to extract relevant content
    const $ = cheerio.load(html);

    // Extract the main content from the article
    const content = $("article.docs-content").text().trim();

    // Extract the title from the page
    const title = $("h1").first().text().trim();

    // Try to determine the category from the URL
    const urlParts = url
      .replace(KESTRA_DOCS_BASE_URL, "")
      .split("/")
      .filter((part) => part.length > 0);
    const category = urlParts.length > 0 ? urlParts[0] : "general";

    return {
      path: url,
      content: content || "No content could be extracted from the page",
      metadata: {
        title: title || "Unknown Title",
        category,
        version: "latest", // Assuming latest version
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching Kestra doc: ${errorMessage}`);
    throw error;
  }
}

/**
 * Interface for Kestra Search API response item
 */
interface KestraSearchResult {
  url: string;
  type: string;
  title: string;
  highlights: string[];
}

/**
 * Interface for Kestra Search API response
 */
interface KestraSearchResponse {
  results: KestraSearchResult[];
}

/**
 * Tool for searching Kestra documentation using the official Kestra search API
 */
export const kestraDocsSearchTool = createTool({
  id: "kestra-docs-search",
  description:
    "Search Kestra documentation to find answers about Kestra functionality, workflows, plugins, and more",
  inputSchema: DocQuerySchema,
  outputSchema: DocResultSchema,
  execute: async ({ context: { query, filter } }) => {
    console.log(`Searching Kestra docs for: ${query}`);

    try {
      // Use the official Kestra search API
      const searchUrl = `https://api.kestra.io/v1/search?q=${encodeURIComponent(query)}`;

      console.log(`Querying Kestra search API: ${searchUrl}`);

      // Fetch search results from the API
      const response = await axios.get(searchUrl);
      const searchResponse: KestraSearchResponse = response.data;
      const results = searchResponse.results || [];

      if (results && results.length > 0) {
        // Get the first result with a URL
        const firstDocResult = results[0];

        if (firstDocResult && firstDocResult.url) {
          // Format the URL if it's a relative path
          const fullUrl = firstDocResult.url.startsWith('http') 
            ? firstDocResult.url 
            : `https://kestra.io/${firstDocResult.url}`;

          // Fetch the full content of the first search result document
          const docResult = await fetchKestraDoc(fullUrl);

          // Enhance the content with the search highlights if available
          if (firstDocResult.highlights && firstDocResult.highlights.length > 0) {
            docResult.content = [
              docResult.content,
              "\n\nSearch Matches:\n",
              ...firstDocResult.highlights.map(
                (highlight) => `- ${highlight.replace(/<\/?mark>/g, "**").replace(/<br \/>\n/g, "\n")}`
              ),
            ].join("\n");
          }

          return docResult;
        }

        // If we couldn't fetch the document but have search results, build a response from them
        const combinedResults = results
          .slice(0, 5)
          .map((result) => {
            const title = result.title || "Untitled";
            const url = result.url.startsWith('http') 
              ? result.url 
              : `https://kestra.io/${result.url}`;
            const highlights = result.highlights || [];

            return `## ${title}\n\n${highlights.map((h) => `- ${h.replace(/<\/?mark>/g, "**").replace(/<br \/>\n/g, "\n")}`).join("\n")}\n\n${url ? `[View Documentation](${url})` : ""}`;
          })
          .join("\n\n");

        return {
          content: `# Search Results for "${query}"\n\n${combinedResults}`,
          path: searchUrl,
          metadata: {
            title: `Search Results for "${query}"`,
            category: filter?.category || "general",
            version: filter?.version || "latest",
            lastUpdated: new Date().toISOString(),
          },
        };
      }

      // If no results were found
      return {
        content: `No documentation found for query: "${query}". Please try a different search term or check the Kestra documentation at ${KESTRA_DOCS_BASE_URL}/getting-started`,
        path: searchUrl,
        metadata: {
          title: "No Search Results",
          category: filter?.category || "general",
          version: filter?.version || "latest",
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error searching Kestra docs: ${errorMessage}`);

      // Return an error message
      return {
        content: `Error searching Kestra documentation: ${errorMessage}. Please try again later or check the Kestra website directly.`,
        path: KESTRA_DOCS_BASE_URL,
        metadata: {
          title: "Error",
          category: "error",
          version: "latest",
          lastUpdated: new Date().toISOString(),
        },
      };
    }
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

    try {
      // Directly fetch the documentation from the specified path
      const result = await fetchKestraDoc(query);
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error fetching Kestra doc by path: ${errorMessage}`);

      // Return an error message
      return {
        content: `No documentation found at path: ${query}. Error: ${errorMessage}`,
        path: query,
        metadata: {
          title: "Not Found",
          category: "error",
          version: "latest",
          lastUpdated: new Date().toISOString(),
        },
      };
    }
  },
});
