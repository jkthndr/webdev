import * as fs from "fs";
import * as path from "path";
import { takeScreenshot } from "../screenshot.js";
import type { ProjectManager } from "../project-manager.js";

const THUMB_WIDTH = 400;
const THUMB_HEIGHT = 250;

export class ScreenshotCache {
  constructor(private pm: ProjectManager) {}

  private cacheDir(projectName: string): string {
    const info = this.pm.getProjectInfo(projectName);
    if (!info) throw new Error(`Project '${projectName}' not found`);
    return path.join(info.dir, ".studio", "thumbnails");
  }

  private cacheKey(screen: string, hash: string): string {
    return `${screen}-${hash.slice(0, 8)}.png`;
  }

  async getThumbnail(projectName: string, screen: string): Promise<Buffer | null> {
    const hash = this.pm.getCurrentHash(projectName);
    if (!hash) return null;

    const dir = this.cacheDir(projectName);
    const file = path.join(dir, this.cacheKey(screen, hash));

    // Cache hit
    if (fs.existsSync(file)) {
      return fs.readFileSync(file);
    }

    // Cache miss — generate thumbnail
    const port = this.pm.getDevServerPort(projectName);
    if (!port) return null;

    const url = `http://localhost:${port}/screens/${screen}`;
    try {
      const buffer = await takeScreenshot({
        url,
        viewport: { width: THUMB_WIDTH * 2, height: THUMB_HEIGHT * 2 },
      });

      // Save to cache
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, buffer);

      return buffer;
    } catch {
      return null;
    }
  }

  hasCached(projectName: string, screen: string): boolean {
    const hash = this.pm.getCurrentHash(projectName);
    if (!hash) return false;
    const dir = this.cacheDir(projectName);
    return fs.existsSync(path.join(dir, this.cacheKey(screen, hash)));
  }

  /** Check if a screenshot exists for a specific hash. */
  hasCachedForHash(projectName: string, screen: string, hash: string): boolean {
    try {
      const dir = this.cacheDir(projectName);
      return fs.existsSync(path.join(dir, this.cacheKey(screen, hash)));
    } catch {
      return false;
    }
  }

  /** Get a cached screenshot for a specific hash (returns null if not cached). */
  getCachedForHash(projectName: string, screen: string, hash: string): Buffer | null {
    try {
      const dir = this.cacheDir(projectName);
      const file = path.join(dir, this.cacheKey(screen, hash));
      if (fs.existsSync(file)) {
        return fs.readFileSync(file);
      }
    } catch {}
    return null;
  }
}
