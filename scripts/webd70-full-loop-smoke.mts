import fs from "fs";
import path from "path";
import { ProjectManager } from "../src/server/project-manager.ts";
import { closeBrowser } from "../src/server/screenshot.ts";

const name = "webd70-smoke";
const root = path.resolve("projects", name);

function removeSmokeProject(): void {
  const projectsRoot = path.resolve("projects");
  if (!root.startsWith(projectsRoot)) {
    throw new Error(`Refusing to remove unexpected path: ${root}`);
  }
  if (fs.existsSync(root)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function assert(cond: boolean, message: string): void {
  if (!cond) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

removeSmokeProject();

const pm = new ProjectManager();

try {
  await pm.openOrCreate(name);
  const brief = pm.saveDesignBrief(name, {
    title: "Aster Studio",
    summary: "A focused landing page for a self-hosted agent design tool.",
    audience: "Solo builders and product teams who want production-ready web UI without hosted design-tool usage limits.",
    goals: ["Explain the value in one screen", "Make the proof loop feel trustworthy"],
    tone: ["warm", "precise", "confident"],
    mustHaves: ["Hero with primary action", "Proof workflow section", "Trust cues for self-hosting"],
    avoid: ["Purple gradients", "Fake analytics", "Generic stock imagery"],
    routes: [{ name: "landing", purpose: "Primary landing screen for first-time evaluators", status: "draft" }],
    inspiration: [],
    notes: "Smoke test for WEBD-70.",
  });
  assert(brief.routes.length === 1, "brief should save route");

  const created = pm.createScreenFromBrief(name, "landing");
  assert(created.warnings.length === 0, `expected no warnings, got ${JSON.stringify(created.warnings)}`);
  assert(created.matchedRoute?.purpose === "Primary landing screen for first-time evaluators", "should match landing route");

  const source = fs.readFileSync(created.file, "utf-8");
  assert(source.includes("Project: Aster Studio"), "screen should include brief title");
  assert(source.includes("Purpose: Primary landing screen"), "screen should include route purpose");
  assert(source.includes("Avoid:"), "screen should include avoid guidance");

  const devPort = await pm.switchToDevMode(name);
  const previewUrl = `http://localhost:${devPort}/screens/landing`;
  const preview = await fetch(previewUrl);
  const previewHtml = await preview.text();
  assert(preview.ok, `dev preview should return 200, got ${preview.status}`);
  assert(previewHtml.includes("Scaffolded from design brief"), "dev preview should render scaffolded screen");
  assert(pm.getDevServerMode(name) === "development", "runtime should be in advisory dev mode before proof");

  const proof = await pm.runProof(name, "landing", {
    message: "WEBD-70 full loop proof smoke",
  });
  assert(proof.status === "passed", "proof should pass");
  assert(proof.runtimeMode === "production", "proof should use production runtime");
  assert(!!proof.checkpointHash, "proof should create checkpoint");
  assert(!!proof.screenshotPath, "proof should write screenshot path");
  assert(fs.existsSync(path.join(root, proof.screenshotPath!)), "proof screenshot should exist");
  assert(pm.getDevServerMode(name) === "production", "runtime should switch to production mode after proof");

  console.log(JSON.stringify({
    smoke: "WEBD-70 brief-preview-proof loop",
    project: name,
    route: created.route,
    devPreview: previewUrl,
    proofStatus: proof.status,
    checkpointHash: proof.checkpointHash,
    changedFiles: proof.changedFiles,
    result: "ok",
  }, null, 2));
} finally {
  pm.stopAll();
  await closeBrowser();
  removeSmokeProject();
}
