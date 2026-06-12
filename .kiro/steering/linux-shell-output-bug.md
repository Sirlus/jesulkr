---
inclusion: auto
---

# Linux Shell Output Bug - Known Issue

## Summary
In Linux environments, shell command output is not reliably displayed to agents through the `execute_bash` tool. This is a known Kiro bug that affects all bash command executions.

## Impact
- Command output may appear empty or truncated
- Exit codes are still reliable and should be used to determine success/failure
- Commands ARE executing correctly - the issue is only with output visibility

## Workarounds

### 1. Redirect Output to Files
When you need to capture command output, redirect to a file and read it:

```bash
# Instead of relying on visible output
some-command > /tmp/output.txt 2>&1
```

Then use `read_file` to read `/tmp/output.txt`.

### 2. Check Exit Codes
Exit codes are reliable. Use them to verify success:

```bash
some-command
echo "EXIT_CODE: $?" > /tmp/status.txt
```

### 3. Use File-Based Tools
Prefer dedicated tools over shell commands:
- Use `read_file` / `read_files` instead of `cat`
- Use `grep_search` instead of `grep`
- Use `file_search` instead of `find`
- Use `list_directory` instead of `ls`

### 4. Write Status to Files
For critical operations, write status information to files that can be read:

```bash
npm run build && echo "BUILD_SUCCESS" > /tmp/build-status.txt || echo "BUILD_FAILED" > /tmp/build-status.txt
```

## Examples

### Checking if a command succeeded
```bash
# Create a marker file on success
npm test && echo "TESTS_PASSED" > /tmp/test-result.txt || echo "TESTS_FAILED" > /tmp/test-result.txt
```

Then read the result file to determine outcome.

### Getting command output
```bash
# Redirect output to a file
node --version > /tmp/node-version.txt 2>&1
```

Then read `/tmp/node-version.txt` to see the version.

## Important Notes
- This bug affects all Linux environments
- The issue is intermittent but should be assumed present
- Always verify critical operations through file-based methods
- Never assume a command failed just because output is not visible
