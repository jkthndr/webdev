import express from "express";
import fs from "fs";
import type { Server } from "http";
import type { AddressInfo } from "net";
import path from "path";
import { ProjectManager } from "../src/server/project-manager.ts";
import { closeBrowser } from "../src/server/screenshot.ts";
import { createStudioApiRouter } from "../src/server/studio/routes.ts";

const name = "webd73-feedback-smoke";
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

async function closeServer(server: Server | null): Promise<void> {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server.close((err) => err ? reject(err) : resolve());
  });
}

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo | null;
  if (!address) {
    throw new Error("Smoke API server did not expose an address");
  }
  return address.port;
}

removeSmokeProject();

const pm = new ProjectManager();
let server: Server | null = null;

try {
  await pm.openOrCreate(name);
  pm.saveDesignBrief(name, {
    title: "Aster Studio",
    summary: "A self-hosted web design loop for production-ready screens.",
    audience: "Solo builders and small product teams",
    goals: ["Use human feedback in the next revision context"],
    tone: ["warm", "precise"],
    mustHaves: ["Landing screen with proof workflow"],
    avoid: ["Purple gradients"],
    routes: [{ name: "landing", purpose: "Primary first-run landing screen", status: "draft" }],
    inspiration: [],
    notes: "Smoke test for pinned feedback round-trip.",
  });

  const created = pm.createScreenFromBrief(name, "landing");
  assert(created.warnings.length === 0, `expected no warnings, got ${JSON.stringify(created.warnings)}`);

  const app = express();
  app.use(express.json());
  app.use("/api", createStudioApiRouter(pm));
  server = app.listen(0, "127.0.0.1");
  const port = await listen(server);
  const base = `http://127.0.0.1:${port}/api/projects/${name}`;

  const addRes = await fetch(`${base}/feedback`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      screen: "landing",
      x: 37.5,
      y: 42,
      text: "Tighten the hero proof language before the next generation pass.",
      author: "oliver",
    }),
  });
  assert(addRes.ok, `feedback POST should succeed, got ${addRes.status}`);
  const annotation = await addRes.json() as { id: string; screen: string; text: string; resolved: boolean };
  assert(annotation.id.length > 0, "created feedback should have id");
  assert(annotation.screen === "landing", "created feedback should target landing");
  assert(annotation.resolved === false, "created feedback should start unresolved");

  const feedbackRes = await fetch(`${base}/feedback`);
  assert(feedbackRes.ok, `feedback GET should succeed, got ${feedbackRes.status}`);
  const feedbackList = await feedbackRes.json() as { feedback: Array<{ id: string; text: string }> };
  assert(feedbackList.feedback.some((item) => item.id === annotation.id), "feedback GET should return created annotation");

  const apiContextRes = await fetch(`${base}/generation-context?screen=landing`);
  assert(apiContextRes.ok, `generation-context GET should succeed, got ${apiContextRes.status}`);
  const apiContext = await apiContextRes.json() as {
    unresolvedFeedback: Array<{ id: string; text: string; screen: string }>;
    screenCode: string | null;
  };
  assert(apiContext.unresolvedFeedback.length === 1, "API generation context should include one unresolved pin");
  assert(apiContext.unresolvedFeedback[0].id === annotation.id, "API generation context should include created pin");
  assert(apiContext.unresolvedFeedback[0].text.includes("hero proof language"), "API generation context should carry feedback text");
  assert(apiContext.screenCode?.includes("Scaffolded from design brief") === true, "API context should include current screen code");

  const directContext = pm.getGenerationContext(name, "landing");
  assert(directContext.unresolvedFeedback.length === 1, "ProjectManager context should include unresolved pin");
  assert(directContext.unresolvedFeedback[0].id === annotation.id, "ProjectManager context should carry the same pin id");

  const resolveRes = await fetch(`${base}/feedback/${annotation.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ resolved: true }),
  });
  assert(resolveRes.ok, `feedback resolve PATCH should succeed, got ${resolveRes.status}`);

  const resolvedContext = pm.getGenerationContext(name, "landing");
  assert(resolvedContext.unresolvedFeedback.length === 0, "resolved feedback should be excluded from next generation context");

  console.log(JSON.stringify({
    smoke: "WEBD-73 pinned feedback round-trip",
    project: name,
    screen: "landing",
    feedbackId: annotation.id,
    savedViaStudioApi: true,
    returnedByStudioApi: true,
    includedInGenerationContext: true,
    resolvedFeedbackExcluded: true,
    result: "ok",
  }, null, 2));
} finally {
  await closeServer(server);
  pm.stopAll();
  await closeBrowser();
  removeSmokeProject();
}
