import { Router, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import * as fs from "fs";
import * as path from "path";
import type { ProjectManager } from "../project-manager.js";
import { ProofRunFailedError } from "../proof.js";
import { ScreenshotCache } from "./screenshot-cache.js";
import { galleryPage, projectPage, screenPage } from "./pages.js";
import { canvasPage } from "./canvas-page.js";

export function createStudioRouter(pm: ProjectManager): Router {
  const router = Router();

  // Gallery
  router.get("/", (_req: Request, res: Response) => {
    const projects = pm.listProjects();
    res.type("html").send(galleryPage(projects));
  });

  // Auto-start helper: kick off preview server in background if not running/starting
  function autoStart(project: string): void {
    if (pm.getDevServerPort(project) === null && !pm.isStarting(project)) {
      pm.startDevServer(project).catch(() => {});
    }
  }

  // Project detail
  router.get("/:project", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const info = pm.getProjectInfo(project);
    if (!info) {
      res.status(404).send("Project not found");
      return;
    }
    autoStart(project);
    const running = pm.getDevServerPort(project) !== null;
    const starting = pm.isStarting(project);
    res.type("html").send(projectPage(info, running, starting));
  });

  // Canvas view — must be before /:project/:screen
  router.get("/:project/canvas", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const info = pm.getProjectInfo(project);
    if (!info) {
      res.status(404).send("Project not found");
      return;
    }
    autoStart(project);
    const running = pm.getDevServerPort(project) !== null;
    const starting = pm.isStarting(project);
    const hash = pm.getCurrentHash(project) || "unknown";
    res.type("html").send(canvasPage(info, running, starting, hash));
  });

  // Screen detail
  router.get("/:project/:screen", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const screen = String(req.params.screen);
    const info = pm.getProjectInfo(project);
    if (!info) {
      res.status(404).send("Project not found");
      return;
    }
    if (!info.screens.includes(screen)) {
      res.status(404).send("Screen not found");
      return;
    }
    autoStart(project);
    const hash = pm.getCurrentHash(project) || "unknown";
    const running = pm.getDevServerPort(project) !== null;
    const starting = pm.isStarting(project);
    res.type("html").send(screenPage(info, screen, hash, running, starting));
  });

  return router;
}

export function createStudioApiRouter(pm: ProjectManager): Router {
  const router = Router();
  const cache = new ScreenshotCache(pm);

  // List all screens in a project (for canvas)
  router.get("/projects/:project/screens", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const info = pm.getProjectInfo(project);
    if (!info) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const hash = pm.getCurrentHash(project) || "unknown";
    const running = pm.getDevServerPort(project) !== null;
    const screens = info.screens.map(name => ({
      name,
      route: `/screens/${name}`,
      thumbnailUrl: `/api/projects/${project}/screens/${name}/thumbnail`,
      hasCachedThumb: cache.hasCached(project, name),
    }));
    res.json({ project, screens, hash, running });
  });

  // Get canvas layout
  router.get("/projects/:project/layout", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const info = pm.getProjectInfo(project);
    if (!info) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const layoutFile = path.join(info.dir, ".studio", "layout.json");
    if (fs.existsSync(layoutFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(layoutFile, "utf-8"));
        res.json(data);
        return;
      } catch {}
    }
    res.json({ positions: {}, viewport: null, savedAt: null });
  });

  // Save canvas layout
  router.post("/projects/:project/layout", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const info = pm.getProjectInfo(project);
    if (!info) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const layoutDir = path.join(info.dir, ".studio");
    fs.mkdirSync(layoutDir, { recursive: true });
    const layoutFile = path.join(layoutDir, "layout.json");
    const data = {
      positions: req.body.positions || {},
      viewport: req.body.viewport || null,
      savedAt: new Date().toISOString(),
    };
    fs.writeFileSync(layoutFile, JSON.stringify(data, null, 2));
    res.json({ ok: true });
  });

  // Persistent design brief
  router.get("/projects/:project/design-brief", (req: Request, res: Response) => {
    const project = String(req.params.project);
    if (!pm.getProjectInfo(project)) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const existing = pm.getDesignBrief(project);
    res.json({
      exists: existing !== null,
      brief: existing ?? pm.getOrCreateDesignBrief(project),
    });
  });

  router.put("/projects/:project/design-brief", (req: Request, res: Response) => {
    const project = String(req.params.project);
    if (!pm.getProjectInfo(project)) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    try {
      const brief = pm.saveDesignBrief(project, req.body || {});
      res.json({ ok: true, brief });
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/projects/:project/generation-context", (req: Request, res: Response) => {
    const project = String(req.params.project);
    if (!pm.getProjectInfo(project)) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const screen = typeof req.query.screen === "string" ? req.query.screen : null;
    res.json(pm.getGenerationContext(project, screen));
  });

  // Screen thumbnail
  router.get("/projects/:project/screens/:screen/thumbnail", async (req: Request, res: Response) => {
    const project = String(req.params.project);
    const screen = String(req.params.screen);
    try {
      const buffer = await cache.getThumbnail(project, screen);
      if (!buffer) {
        res.status(404).send("Could not generate thumbnail");
        return;
      }
      res.type("png").set("Cache-Control", "public, max-age=10").send(buffer);
    } catch (e) {
      res.status(500).send(`Thumbnail error: ${e instanceof Error ? e.message : String(e)}`);
    }
  });

  // Screen code
  router.get("/projects/:project/screens/:screen/code", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const screen = String(req.params.screen);
    const code = pm.readScreenCode(project, screen);
    if (code === null) {
      res.status(404).json({ error: "Screen not found" });
      return;
    }
    res.json({ code });
  });

  // Preview server status (for polling during auto-start)
  router.get("/projects/:project/status", (req: Request, res: Response) => {
    const project = String(req.params.project);
    if (!pm.getProjectInfo(project)) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const port = pm.getDevServerPort(project);
    res.json({
      running: port !== null,
      starting: pm.isStarting(project),
      port,
    });
  });

  // Current git hash (for polling)
  router.get("/projects/:project/hash", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const hash = pm.getCurrentHash(project);
    if (!hash) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json({ hash });
  });

  // Production proof runs
  router.get("/projects/:project/proof-runs", (req: Request, res: Response) => {
    const project = String(req.params.project);
    if (!pm.getProjectInfo(project)) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json({ proofRuns: pm.listProofRuns(project) });
  });

  router.post("/projects/:project/screens/:screen/proof", async (req: Request, res: Response) => {
    const project = String(req.params.project);
    const screen = String(req.params.screen);
    if (!pm.getProjectInfo(project)) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    try {
      const run = await pm.runProof(project, screen, {
        viewport: req.body.viewport,
        fullPage: req.body.fullPage,
        message: req.body.message,
      });
      res.json({
        ok: true,
        proofRun: run,
        screenshotUrl: `/api/projects/${project}/proof-runs/${run.id}/screenshot`,
      });
    } catch (e) {
      if (e instanceof ProofRunFailedError) {
        res.status(500).json({ ok: false, error: e.message, proofRun: e.run });
        return;
      }
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/projects/:project/proof-runs/:id/screenshot", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const id = String(req.params.id);
    const file = pm.getProofScreenshotPath(project, id);
    if (!file) {
      res.status(404).send("Proof screenshot not found");
      return;
    }
    res.type("png").set("Cache-Control", "public, max-age=86400").sendFile(file);
  });

  // List checkpoints
  router.get("/projects/:project/checkpoints", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const info = pm.getProjectInfo(project);
    if (!info) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const checkpoints = pm.getCheckpoints(project);
    const currentHash = pm.getCurrentHash(project);
    // For each checkpoint, note which screens have cached thumbnails
    res.json({
      current: currentHash,
      checkpoints: checkpoints.map(cp => ({
        ...cp,
        isCurrent: cp.hash === currentHash,
        screens: info.screens.map(s => ({
          name: s,
          hasThumbnail: cache.hasCachedForHash(project, s, cp.hash),
        })),
      })),
    });
  });

  // Historical screenshot for a specific checkpoint
  router.get("/projects/:project/checkpoints/:hash/screenshots/:screen", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const hash = String(req.params.hash);
    const screen = String(req.params.screen);
    if (!/^[a-f0-9]{7,40}$/.test(hash)) {
      res.status(400).json({ error: "Invalid hash" });
      return;
    }
    const buffer = cache.getCachedForHash(project, screen, hash);
    if (!buffer) {
      res.status(404).send("No cached screenshot for this checkpoint");
      return;
    }
    res.type("png").set("Cache-Control", "public, max-age=86400").send(buffer);
  });

  // --- Feedback annotations ---

  function feedbackFile(projectName: string): string | null {
    const info = pm.getProjectInfo(projectName);
    if (!info) return null;
    return path.join(info.dir, ".studio", "feedback.json");
  }

  function readFeedback(projectName: string): any[] {
    const file = feedbackFile(projectName);
    if (!file || !fs.existsSync(file)) return [];
    try { return JSON.parse(fs.readFileSync(file, "utf-8")); } catch { return []; }
  }

  function writeFeedback(projectName: string, data: any[]): void {
    const file = feedbackFile(projectName);
    if (!file) return;
    const dir = path.dirname(file);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }

  // List feedback
  router.get("/projects/:project/feedback", (req: Request, res: Response) => {
    const project = String(req.params.project);
    if (!pm.getProjectInfo(project)) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const feedback = readFeedback(project);
    res.json({ feedback });
  });

  // Add feedback annotation
  router.post("/projects/:project/feedback", (req: Request, res: Response) => {
    const project = String(req.params.project);
    if (!pm.getProjectInfo(project)) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const { screen, x, y, text, author } = req.body;
    if (!screen || x == null || y == null || !text) {
      res.status(400).json({ error: "Missing required fields: screen, x, y, text" });
      return;
    }
    const annotation = {
      id: randomUUID(),
      screen: String(screen),
      x: Number(x),
      y: Number(y),
      text: String(text),
      author: String(author || "human"),
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    const feedback = readFeedback(project);
    feedback.push(annotation);
    writeFeedback(project, feedback);
    res.json(annotation);
  });

  // Update feedback (resolve/edit)
  router.patch("/projects/:project/feedback/:id", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const id = String(req.params.id);
    const feedback = readFeedback(project);
    const idx = feedback.findIndex((f: any) => f.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "Annotation not found" });
      return;
    }
    if (req.body.resolved !== undefined) feedback[idx].resolved = Boolean(req.body.resolved);
    if (req.body.text !== undefined) feedback[idx].text = String(req.body.text);
    writeFeedback(project, feedback);
    res.json(feedback[idx]);
  });

  // Delete feedback
  router.delete("/projects/:project/feedback/:id", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const id = String(req.params.id);
    let feedback = readFeedback(project);
    const before = feedback.length;
    feedback = feedback.filter((f: any) => f.id !== id);
    if (feedback.length === before) {
      res.status(404).json({ error: "Annotation not found" });
      return;
    }
    writeFeedback(project, feedback);
    res.json({ ok: true });
  });

  // --- Inline editing ---

  // Switch to dev mode (HMR) for interactive editing
  router.post("/projects/:project/switch-to-dev", async (req: Request, res: Response) => {
    const project = String(req.params.project);
    if (!pm.getProjectInfo(project)) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    try {
      const port = await pm.switchToDevMode(project);
      res.json({ ok: true, port, mode: "development" });
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  // Edit text in a screen's TSX source
  router.post("/projects/:project/screens/:screen/edit-text", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const screen = String(req.params.screen);
    const { oldText, newText } = req.body;
    if (!oldText || newText === undefined) {
      res.status(400).json({ error: "Missing oldText or newText" });
      return;
    }
    const code = pm.readScreenCode(project, screen);
    if (code === null) {
      res.status(404).json({ error: "Screen not found" });
      return;
    }

    // Find and replace the text in the TSX source
    const occurrences = code.split(oldText).length - 1;
    if (occurrences === 0) {
      res.status(400).json({ error: "Text not found in source", oldText });
      return;
    }
    if (occurrences === 1) {
      // Exact single match — safe to replace
      const updated = code.replace(oldText, newText);
      pm.editScreenCode(project, screen, updated);
      res.json({ ok: true, replaced: 1 });
      return;
    }
    // Multiple matches — use context to disambiguate (replace first match for now)
    const updated = code.replace(oldText, newText);
    pm.editScreenCode(project, screen, updated);
    res.json({ ok: true, replaced: 1, note: `${occurrences} occurrences found, replaced first` });
  });

  // Restore checkpoint
  router.post("/projects/:project/restore", async (req: Request, res: Response) => {
    const project = String(req.params.project);
    const hash = String(req.body.hash || "");
    if (!/^[a-f0-9]{7,40}$/.test(hash)) {
      res.status(400).json({ error: "Invalid hash" });
      return;
    }
    try {
      pm.restoreCheckpoint(project, hash);
      // Rebuild if the server is running
      if (pm.getDevServerPort(project) !== null) {
        await pm.rebuildAndRestart(project);
      }
      res.json({ ok: true, hash });
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  return router;
}
