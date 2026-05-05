import { randomUUID } from "node:crypto";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import type { ProjectCheckpointService } from "./checkpoint.js";
import type { PreviewRuntimeService } from "./preview-runtime.js";
import type { ProjectWorkspaceService } from "./workspace.js";
import { takeScreenshot } from "./screenshot.js";

export interface ProofViewport {
  width: number;
  height: number;
}

export interface ProofRunOptions {
  viewport?: ProofViewport;
  fullPage?: boolean;
  message?: string;
}

export interface ProofRun {
  id: string;
  project: string;
  screen: string;
  route: string;
  url: string | null;
  status: "passed" | "failed";
  runtimeMode: "production";
  viewport: ProofViewport;
  fullPage: boolean;
  startedAt: string;
  completedAt: string;
  changedFiles: string[];
  screenshotPath: string | null;
  checkpointHash: string | null;
  failureStage?: "build_start" | "screenshot" | "checkpoint";
  error?: string;
}

function proofRunId(): string {
  return `proof-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${randomUUID().slice(0, 8)}`;
}

function relativePath(fromDir: string, filePath: string): string {
  return path.relative(fromDir, filePath).replace(/\\/g, "/");
}

function changedFiles(projectDir: string): string[] {
  try {
    const output = execSync("git status --porcelain", { cwd: projectDir, encoding: "utf-8" });
    return output.split("\n")
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .map((line) => line.slice(3));
  } catch {
    return [];
  }
}

function ensureProofRunsIgnored(projectDir: string): void {
  const gitInfoDir = path.join(projectDir, ".git", "info");
  if (!fs.existsSync(gitInfoDir)) return;
  const excludeFile = path.join(gitInfoDir, "exclude");
  const ignoreLine = ".studio/proof-runs/";
  const existing = fs.existsSync(excludeFile) ? fs.readFileSync(excludeFile, "utf-8") : "";
  if (existing.split(/\r?\n/).includes(ignoreLine)) return;
  fs.appendFileSync(excludeFile, `${existing.endsWith("\n") || existing.length === 0 ? "" : "\n"}${ignoreLine}\n`);
}

function writeRun(projectDir: string, run: ProofRun): void {
  const root = path.join(projectDir, ".studio", "proof-runs");
  const runDir = path.join(root, run.id);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, "run.json"), `${JSON.stringify(run, null, 2)}\n`);
  fs.writeFileSync(path.join(root, "latest.json"), `${JSON.stringify(run, null, 2)}\n`);
}

export class ProofRunFailedError extends Error {
  constructor(readonly run: ProofRun) {
    super(run.error || "Proof run failed");
    this.name = "ProofRunFailedError";
  }
}

export class ProjectProofService {
  constructor(
    private workspace: ProjectWorkspaceService,
    private runtime: PreviewRuntimeService,
    private checkpoints: ProjectCheckpointService,
  ) {}

  async runProof(projectName: string, screenName: string, options: ProofRunOptions = {}): Promise<ProofRun> {
    const projectDir = this.workspace.projectDir(projectName);
    if (!fs.existsSync(path.join(projectDir, "package.json"))) {
      throw new Error(`Project '${projectName}' not found`);
    }
    if (!this.workspace.listScreens(projectName).includes(screenName)) {
      throw new Error(`Screen '${screenName}' not found in project '${projectName}'`);
    }

    const id = proofRunId();
    const startedAt = new Date().toISOString();
    const viewport = options.viewport ?? { width: 1280, height: 800 };
    const fullPage = options.fullPage ?? true;
    const filesBeforeProofArtifact = changedFiles(projectDir);
    ensureProofRunsIgnored(projectDir);
    const route = `/screens/${screenName}`;
    let url: string | null = null;
    let failureStage: ProofRun["failureStage"] = "build_start";

    try {
      const port = await this.runtime.startProductionServer(projectName);
      url = `http://localhost:${port}${route}`;
      failureStage = "screenshot";
      const screenshot = await takeScreenshot({ url, viewport, fullPage });

      const runDir = path.join(projectDir, ".studio", "proof-runs", id);
      fs.mkdirSync(runDir, { recursive: true });
      const screenshotAbs = path.join(runDir, "screenshot.png");
      fs.writeFileSync(screenshotAbs, screenshot);

      failureStage = "checkpoint";
      const checkpointHash = this.checkpoints.checkpoint(
        projectName,
        options.message || `Proof ${screenName}: production screenshot`,
      );

      const run: ProofRun = {
        id,
        project: projectName,
        screen: screenName,
        route,
        url,
        status: "passed",
        runtimeMode: "production",
        viewport,
        fullPage,
        startedAt,
        completedAt: new Date().toISOString(),
        changedFiles: filesBeforeProofArtifact,
        screenshotPath: relativePath(projectDir, screenshotAbs),
        checkpointHash,
      };
      writeRun(projectDir, run);
      return run;
    } catch (e) {
      const run: ProofRun = {
        id,
        project: projectName,
        screen: screenName,
        route,
        url,
        status: "failed",
        runtimeMode: "production",
        viewport,
        fullPage,
        startedAt,
        completedAt: new Date().toISOString(),
        changedFiles: filesBeforeProofArtifact,
        screenshotPath: null,
        checkpointHash: null,
        failureStage,
        error: e instanceof Error ? e.message : String(e),
      };
      writeRun(projectDir, run);
      throw new ProofRunFailedError(run);
    }
  }

  listProofRuns(projectName: string): ProofRun[] {
    const root = path.join(this.workspace.projectDir(projectName), ".studio", "proof-runs");
    if (!fs.existsSync(root)) return [];
    return fs.readdirSync(root)
      .filter((entry) => entry !== "latest.json")
      .map((entry) => this.getProofRun(projectName, entry))
      .filter((run): run is ProofRun => run !== null)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  getProofRun(projectName: string, id: string): ProofRun | null {
    if (!/^proof-\d{14}-[a-f0-9]{8}$/.test(id)) return null;
    const file = path.join(this.workspace.projectDir(projectName), ".studio", "proof-runs", id, "run.json");
    if (!fs.existsSync(file)) return null;
    try {
      return JSON.parse(fs.readFileSync(file, "utf-8")) as ProofRun;
    } catch {
      return null;
    }
  }

  getProofScreenshotPath(projectName: string, id: string): string | null {
    const run = this.getProofRun(projectName, id);
    if (!run?.screenshotPath) return null;
    const file = path.join(this.workspace.projectDir(projectName), run.screenshotPath);
    return fs.existsSync(file) ? file : null;
  }
}
