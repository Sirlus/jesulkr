#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile } from "fs/promises";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

const server = new Server(
  {
    name: "shell-workaround",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool: Execute command and capture output to file
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "exec_with_output",
        description:
          "Execute a shell command and return the output. This works around the Linux shell output bug by capturing stdout/stderr and returning them directly.",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "The shell command to execute",
            },
            timeout: {
              type: "number",
              description: "Timeout in milliseconds (default: 30000)",
              default: 30000,
            },
          },
          required: ["command"],
        },
      },
      {
        name: "exec_check_success",
        description:
          "Execute a command and return only whether it succeeded (exit code 0). Useful when you only need to know if a command worked.",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "The shell command to execute",
            },
            timeout: {
              type: "number",
              description: "Timeout in milliseconds (default: 30000)",
              default: 30000,
            },
          },
          required: ["command"],
        },
      },
      {
        name: "exec_to_file",
        description:
          "Execute a command, save output to a file, and return the file path. Useful for large outputs or when you need to process the output later.",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "The shell command to execute",
            },
            outputFile: {
              type: "string",
              description:
                "Optional output file path. If not provided, a temp file will be created.",
            },
          },
          required: ["command"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "exec_with_output": {
      const { command, timeout = 30000 } = args;
      try {
        const { stdout, stderr } = await execAsync(command, {
          timeout,
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  exitCode: 0,
                  stdout: stdout.trim(),
                  stderr: stderr.trim(),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  exitCode: error.code || 1,
                  stdout: error.stdout?.trim() || "",
                  stderr: error.stderr?.trim() || error.message,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }

    case "exec_check_success": {
      const { command, timeout = 30000 } = args;
      try {
        await execAsync(command, { timeout });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, exitCode: 0 }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: false, exitCode: error.code || 1 },
                null,
                2
              ),
            },
          ],
        };
      }
    }

    case "exec_to_file": {
      const { command, outputFile } = args;
      const filePath =
        outputFile || `/tmp/shell-output-${randomUUID()}.txt`;
      try {
        const { stdout, stderr } = await execAsync(command, {
          maxBuffer: 10 * 1024 * 1024,
        });
        const content = `=== STDOUT ===\n${stdout}\n\n=== STDERR ===\n${stderr}`;
        await writeFile(filePath, content);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  exitCode: 0,
                  outputFile: filePath,
                  message: `Output saved to ${filePath}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const content = `=== STDOUT ===\n${error.stdout || ""}\n\n=== STDERR ===\n${error.stderr || error.message}`;
        await writeFile(filePath, content);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  exitCode: error.code || 1,
                  outputFile: filePath,
                  message: `Output (including errors) saved to ${filePath}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Shell workaround MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
