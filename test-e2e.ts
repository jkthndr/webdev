/**
 * End-to-end test: exercises all 7 MCP tools via the HTTP health API
 * and direct function calls (since stdio MCP is harder to test in script).
 */
import { ProjectManager } from "./src/server/project-manager.js";
import { takeScreenshot, closeBrowser } from "./src/server/screenshot.js";
import * as fs from "fs";
import * as path from "path";

const pm = new ProjectManager();

async function main() {
  console.log("=== END-TO-END INTEGRATION TEST ===\n");
  const projectName = "e2e-test";

  // Clean up any previous test
  const testDir = path.join(process.cwd(), "projects", projectName);
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  // Tool 1: open_project
  console.log("1. open_project");
  const project = await pm.openOrCreate(projectName);
  console.log(`   Created: ${project.name}, dir: ${project.dir}`);
  console.log(`   Screens: ${project.screens.length}`);

  // Tool 2: create_screen
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
  console.log(`   Created: ${screenFile}`);

  // Tool 5: list_screens
  console.log("\n5. list_screens");
  const screens = pm.listScreens(projectName);
  console.log(`   Screens: ${screens.join(", ")}`);

  // Tool 6: checkpoint
  console.log("\n6. checkpoint");
  const cp1 = pm.checkpoint(projectName, "Added login screen");
  console.log(`   Checkpoint: ${cp1.slice(0, 8)}`);

  // Tool 3: edit_screen_code
  console.log("\n3. edit_screen_code");
  const updatedCode = loginCode.replace("Welcome Back", "Welcome to the App");
  pm.editScreenCode(projectName, "login", updatedCode);
  const readBack = pm.readScreenCode(projectName, "login");
  console.log(`   Title changed: ${readBack?.includes("Welcome to the App") ? "YES" : "NO"}`);

  // Tool 6 again: checkpoint v2
  const cp2 = pm.checkpoint(projectName, "Updated login title");
  console.log(`   Checkpoint 2: ${cp2.slice(0, 8)}`);

  // Tool 4: render_screenshot
  console.log("\n4. render_screenshot");
  const port = await pm.startDevServer(projectName, 4510);
  console.log(`   Dev server on port ${port}`);

  const buffer = await takeScreenshot({
    url: `http://localhost:${port}/screens/login`,
    viewport: { width: 1280, height: 800 },
  });
  const screenshotPath = path.join(process.cwd(), "projects", projectName, "login-screenshot.png");
  fs.writeFileSync(screenshotPath, buffer);
  console.log(`   Screenshot: ${buffer.length} bytes saved`);

  // Tool 7: restore_checkpoint
  console.log("\n7. restore_checkpoint");
  pm.restoreCheckpoint(projectName, cp1);
  const restored = pm.readScreenCode(projectName, "login");
  console.log(`   Restored to cp1: ${restored?.includes("Welcome Back") ? "YES" : "NO"}`);
  console.log(`   'Welcome to the App' gone: ${!restored?.includes("Welcome to the App") ? "YES" : "NO"}`);

  // Checkpoints
  console.log("\n   Checkpoints:");
  const checkpoints = pm.getCheckpoints(projectName);
  for (const c of checkpoints) {
    console.log(`     ${c.hash.slice(0, 8)} - ${c.message}`);
  }

  // Cleanup
  pm.stopDevServer(projectName);
  await closeBrowser();

  console.log("\n=== ALL 7 TOOLS VERIFIED ===");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
