# Shell Output Workaround for Linux

## Problem
There is a known bug in Kiro where shell output is not shown when running on Linux systems. This causes agents to be confused when executing commands because they don't see the output.

## Solution
Use the `shell-workaround` MCP server which captures and returns shell command output through the Model Context Protocol. This server provides three tools:

### Tools
1. **exec_with_output**: Execute a command and return stdout/stderr directly
2. **exec_check_success**: Execute a command and return only success/failure status
3. **exec_to_file**: Execute a command, save output to file, return file path

## Usage Guidelines

### When to Use These Tools
- **Always** use `exec_with_output` when you need to see command output on Linux
- **Always** use `exec_check_success` when you only need to verify success/failure
- **Use** `exec_to_file` for large outputs or when processing is needed later

### Example Prompts for Agents
When working with agents on Linux, add this guidance:

> "IMPORTANT: This is running on Linux where Kiro's shell output is broken. Use the `exec_with_output` MCP tool instead of direct shell execution. This tool captures and returns output so you can see what happened."

### Tool Output Format
All tools return JSON with consistent structure:

```json
{
  "success": true,
  "exitCode": 0,
  "stdout": "command output here",
  "stderr": "error output if any"
}
```

For `exec_check_success`:
```json
{
  "success": true,
  "exitCode": 0
}
```

For `exec_to_file`:
```json
{
  "success": true,
  "exitCode": 0,
  "outputFile": "/tmp/shell-output-xxx.txt",
  "message": "Output saved to /tmp/shell-output-xxx.txt"
}
```

## Configuration
The MCP server is configured in `.mcp.json`:
```json
{
  "mcpServers": {
    "shell-workaround": {
      "type": "stdio",
      "command": "node",
      "args": ["mcp-servers/shell-workaround/index.js"],
      "alwaysAllow": ["exec_with_output", "exec_check_success", "exec_to_file"]
    }
  }
}
```

## Testing
Run the test script to verify the server works:
```bash
node mcp-servers/shell-workaround/test.js
```
