import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Create server instance
const server = new McpServer({
  name: "mcp-ai-dev-tasks",
  version: "1.0.4",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function for reading template files
function readTemplateFile(filename: string): string {
  try {
    // When compiled, the template files are in the same directory as the compiled JS
    const templatePath = join(__dirname, "instructions-template", filename);
    return readFileSync(templatePath, "utf-8");
  } catch (error) {
    console.error(`Error reading template file ${filename}:`, error);
    // Try alternative path in case we're running from src directory during development
    try {
      const altPath = join(__dirname, "..", "src", "instructions-template", filename);
      return readFileSync(altPath, "utf-8");
    } catch (altError) {
      console.error(`Error reading template file from alternative path:`, altError);
      return `Error: Could not read template file ${filename}`;
    }
  }
}

// Register create-prd tool
server.tool(
  "create-prd",
  "Combine initial user prompt with additional instruction to run",
  {
    description: z.string().describe("Description of the feature to build"),
    references: z.string().optional().describe("Optional references to help with the task"),
  },
  async ({ description, references }) => {
    const templateContent = readTemplateFile("create-prd.md");
    
    let resultText = `Instruction:
\`\`\`
${templateContent}
\`\`\`

Feature I want to build:
\`\`\`
${description}
\`\`\``;

    if (references) {
      resultText += `

Reference this file to help you:
\`\`\`
${references}
\`\`\``;
    }

    return {
      content: [
        {
          type: "text",
          text: resultText,
        },
      ],
    };
  },
);

// Register generate-tasks tool
server.tool(
  "generate-tasks",
  "Combine PRD file content with additional instruction to run",
  {
    prd_file_content: z.string().describe("Full content of the PRD file"),
  },
  async ({ prd_file_content }) => {
    const templateContent = readTemplateFile("generate-tasks.md");
    
    const resultText = `Product requirement descriptions:
\`\`\`
${prd_file_content}
\`\`\`

Create tasks using:
\`\`\`
${templateContent}
\`\`\``;

    return {
      content: [
        {
          type: "text",
          text: resultText,
        },
      ],
    };
  },
);

// Register process-task-list tool
server.tool(
  "process-task-list",
  "Initial instructions on how to work through the tasks",
  {
    selected_task_pointer: z.string().describe("The task pointer to start working on"),
  },
  async ({ selected_task_pointer }) => {
    const templateContent = readTemplateFile("process-task-list.md");
    
    const resultText = `Please start on task ${selected_task_pointer} and use:
\`\`\`
${templateContent}
\`\`\``;

    return {
      content: [
        {
          type: "text",
          text: resultText,
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP AI Dev Tasks Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
