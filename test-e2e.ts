/**
 * End-to-end regression test: exercises all 7 MCP tools via direct function calls.
 * Exits with code 1 on any assertion failure.
 *
 * Usage: npx tsx test-e2e.ts
 */
import { ProjectManager } from "./src/server/project-manager.js";
import { takeScreenshot, closeBrowser } from "./src/server/screenshot.js";
import * as fs from "fs";
import * as path from "path";

const pm = new ProjectManager();

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}`);
    failed++;
  }
}

async function main() {
  console.log("=== E2E REGRESSION TEST ===\n");
  const projectName = "e2e-test";

  // Clean up any previous test run
  const testDir = path.join(process.cwd(), "projects", projectName);
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  // --- Tool 1: open_project ---
  console.log("1. open_project");
  const project = await pm.openOrCreate(projectName);
  assert(project.name === projectName, "project name matches");
  assert(fs.existsSync(path.join(project.dir, "package.json")), "package.json exists");
  assert(fs.existsSync(path.join(project.dir, "node_modules")), "node_modules installed");

  // --- Tool 2: create_screen ---
  console.log("\n2. create_screen");
  const loginCode = `import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" />
            </div>
            <Button className="w-full">Sign In</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
`;
  const screenFile = pm.createScreen(projectName, "login", loginCode);
  assert(fs.existsSync(screenFile), "screen file created on disk");
  assert(screenFile.includes("login/page.tsx"), "correct file path");

  // --- Tool 5: list_screens ---
  console.log("\n3. list_screens");
  const screens = pm.listScreens(projectName);
  assert(screens.includes("login"), "login screen listed");
  assert(screens.length === 1, "exactly 1 screen");

  // --- Tool 6: checkpoint ---
  console.log("\n4. checkpoint");
  const cp1 = pm.checkpoint(projectName, "Added login screen");
  assert(/^[a-f0-9]{40}$/.test(cp1), "checkpoint returns valid 40-char hash");

  const checkpoints1 = pm.getCheckpoints(projectName);
  assert(checkpoints1.length >= 2, "at least 2 checkpoints (scaffold + login)");

  // --- Tool 3: edit_screen_code ---
  console.log("\n5. edit_screen_code");
  const updatedCode = loginCode.replace("Welcome Back", "Welcome to the App");
  pm.editScreenCode(projectName, "login", updatedCode);
  const readBack = pm.readScreenCode(projectName, "login");
  assert(readBack !== null, "readScreenCode returns content");
  assert(readBack!.includes("Welcome to the App"), "edit applied correctly");
  assert(!readBack!.includes("Welcome Back"), "old content replaced");

  const cp2 = pm.checkpoint(projectName, "Updated login title");
  assert(cp2 !== cp1, "new checkpoint has different hash");

  // --- Tool 4: render_screenshot ---
  console.log("\n6. render_screenshot");
  const port = await pm.startDevServer(projectName);
  assert(typeof port === "number" && port >= 4501 && port <= 4510, `port ${port} in valid range`);

  const buffer = await takeScreenshot({
    url: `http://localhost:${port}/screens/login`,
    viewport: { width: 1280, height: 800 },
  });
  assert(buffer.length > 1000, `screenshot has content (${buffer.length} bytes)`);

  // Verify PNG magic bytes
  assert(
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47,
    "screenshot is valid PNG"
  );

  // --- Tool 7: restore_checkpoint ---
  console.log("\n7. restore_checkpoint");
  pm.restoreCheckpoint(projectName, cp1);
  const restored = pm.readScreenCode(projectName, "login");
  assert(restored !== null, "screen file still exists after restore");
  assert(restored!.includes("Welcome Back"), "restored to original title");
  assert(!restored!.includes("Welcome to the App"), "edit reverted");

  // --- Cleanup ---
  pm.stopDevServer(projectName);
  await closeBrowser();

  // --- Results ---
  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
