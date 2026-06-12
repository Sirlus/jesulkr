import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function testExec() {
  console.log("Testing exec_with_output...");
  
  try {
    const { stdout, stderr } = await execAsync("echo 'Hello from shell!'");
    console.log("Success:", {
      exitCode: 0,
      stdout: stdout.trim(),
      stderr: stderr.trim()
    });
  } catch (error) {
    console.log("Error:", error.message);
  }

  console.log("\nTesting exec_check_success...");
  
  try {
    await execAsync("ls -la /tmp");
    console.log("Success: true, exitCode: 0");
  } catch (error) {
    console.log("Success: false, exitCode:", error.code || 1);
  }

  console.log("\nTesting a failing command...");
  
  try {
    await execAsync("exit 1");
    console.log("Success: true, exitCode: 0");
  } catch (error) {
    console.log("Success: false, exitCode:", error.code || 1);
  }
}

testExec();
