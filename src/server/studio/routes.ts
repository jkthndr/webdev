import { Router, Request, Response } from "express";
import type { ProjectManager } from "../project-manager.js";
import { ScreenshotCache } from "./screenshot-cache.js";
import { galleryPage, projectPage, screenPage } from "./pages.js";

export function createStudioRouter(pm: ProjectManager): Router {
  const router = Router();

  // Gallery
  router.get("/", (_req: Request, res: Response) => {
    const projects = pm.listProjects();
    res.type("html").send(galleryPage(projects));
  });

  // Project detail
  router.get("/:project", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const info = pm.getProjectInfo(project);
    if (!info) {
      res.status(404).send("Project not found");
      return;
    }
    const running = pm.getDevServerPort(project) !== null;
    res.type("html").send(projectPage(info, running));
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
    const hash = pm.getCurrentHash(project) || "unknown";
    const running = pm.getDevServerPort(project) !== null;
    res.type("html").send(screenPage(info, screen, hash, running));
  });

  return router;
}

export function createStudioApiRouter(pm: ProjectManager): Router {
  const router = Router();
  const cache = new ScreenshotCache(pm);

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

  return router;
}
