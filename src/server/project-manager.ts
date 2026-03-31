import { execSync, exec, spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

export interface ProjectInfo {
  id: string;
  name: string;
  dir: string;
  screens: string[];
  createdAt: string;
}

const PROJECTS_DIR = path.resolve(process.cwd(), "projects");
const TEMPLATE_DIR = path.resolve(import.meta.dirname, "../template");

const VALID_NAME = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;

function validateName(name: string, label: string): void {
  if (!VALID_NAME.test(name)) {
    throw new Error(`Invalid ${label} name '${name}': must be alphanumeric with hyphens/underscores, 1-64 chars`);
  }
}

function sanitizeForShell(s: string): string {
  return s.replace(/[^a-zA-Z0-9 .,!?:;_\-()]/g, "");
}

export class ProjectManager {
  private devServers = new Map<string, { process: ChildProcess; port: number }>();

  constructor() {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  }

  private projectDir(name: string): string {
    validateName(name, "project");
    return path.join(PROJECTS_DIR, name);
  }

  listProjects(): ProjectInfo[] {
    if (!fs.existsSync(PROJECTS_DIR)) return [];
    return fs.readdirSync(PROJECTS_DIR)
      .filter((d) => fs.existsSync(path.join(PROJECTS_DIR, d, "package.json")))
      .map((d) => this.getProjectInfo(d))
      .filter((p): p is ProjectInfo => p !== null);
  }

  getProjectInfo(name: string): ProjectInfo | null {
    const dir = this.projectDir(name);
    if (!fs.existsSync(dir)) return null;
    const screens = this.listScreens(name);
    const stat = fs.statSync(dir);
    return {
      id: name,
      name,
      dir,
      screens,
      createdAt: stat.birthtime.toISOString(),
    };
  }

  async openOrCreate(name: string): Promise<ProjectInfo> {
    const dir = this.projectDir(name);
    const hasPackageJson = fs.existsSync(path.join(dir, "package.json"));
    const hasNodeModules = fs.existsSync(path.join(dir, "node_modules"));

    if (hasPackageJson && hasNodeModules) {
      return this.getProjectInfo(name)!;
    }

    if (!hasPackageJson) {
      // Clone template
      fs.cpSync(TEMPLATE_DIR, dir, { recursive: true });

      // Initialize git
      execSync("git init", { cwd: dir, stdio: "pipe" });
      execSync("git add -A", { cwd: dir, stdio: "pipe" });
      execSync('git commit -m "Initial project scaffold"', { cwd: dir, stdio: "pipe" });
    }

    if (!hasNodeModules) {
      await execAsync("npm install", { cwd: dir, timeout: 120000 });
    }

    return this.getProjectInfo(name)!;
  }

  listScreens(name: string): string[] {
    const screensDir = path.join(this.projectDir(name), "src/app/screens");
    if (!fs.existsSync(screensDir)) return [];
    return fs.readdirSync(screensDir)
      .filter((d) => fs.existsSync(path.join(screensDir, d, "page.tsx")));
  }

  createScreen(projectName: string, screenName: string, code?: string): string {
    validateName(screenName, "screen");
    const dir = this.projectDir(projectName);
    const screenDir = path.join(dir, "src/app/screens", screenName);
    fs.mkdirSync(screenDir, { recursive: true });

    const defaultCode = `export default function ${pascal(screenName)}Screen() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">${screenName}</h1>
      <p className="text-muted-foreground mt-2">New screen — ready for design.</p>
    </div>
  );
}
`;
    const filePath = path.join(screenDir, "page.tsx");
    fs.writeFileSync(filePath, code || defaultCode);
    return filePath;
  }

  readScreenCode(projectName: string, screenName: string): string | null {
    const filePath = path.join(this.projectDir(projectName), "src/app/screens", screenName, "page.tsx");
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, "utf-8");
  }

  editScreenCode(projectName: string, screenName: string, code: string): string {
    const filePath = path.join(this.projectDir(projectName), "src/app/screens", screenName, "page.tsx");
    fs.writeFileSync(filePath, code);
    return filePath;
  }

  checkpoint(projectName: string, message: string): string {
    const dir = this.projectDir(projectName);
    const safeMessage = sanitizeForShell(message) || "checkpoint";
    execSync("git add -A", { cwd: dir, stdio: "pipe" });
    try {
      execSync(`git commit -m "${safeMessage}"`, { cwd: dir, stdio: "pipe" });
    } catch {
      // Nothing to commit
      return execSync("git rev-parse HEAD", { cwd: dir, encoding: "utf-8" }).trim();
    }
    return execSync("git rev-parse HEAD", { cwd: dir, encoding: "utf-8" }).trim();
  }

  restoreCheckpoint(projectName: string, hash: string): void {
    if (!/^[a-f0-9]{7,40}$/.test(hash)) {
      throw new Error(`Invalid checkpoint hash: ${hash}`);
    }
    const dir = this.projectDir(projectName);
    execSync(`git reset --hard ${hash}`, { cwd: dir, stdio: "pipe" });
  }

  getCheckpoints(projectName: string): { hash: string; message: string; date: string }[] {
    const dir = this.projectDir(projectName);
    try {
      const log = execSync('git log --pretty=format:"%H|%s|%ci"', { cwd: dir, encoding: "utf-8" });
      return log.split("\n").filter(Boolean).map((line) => {
        const [hash, message, date] = line.split("|");
        return { hash, message, date };
      });
    } catch {
      return [];
    }
  }

  async startDevServer(projectName: string, port: number): Promise<number> {
    const existing = this.devServers.get(projectName);
    if (existing) return existing.port;

    const dir = this.projectDir(projectName);

    // Build first for production-mode serving (deterministic screenshots)
    await execAsync("npm run build", { cwd: dir, timeout: 120000 });

    const proc = spawn("npx", ["next", "start", "--port", String(port)], {
      cwd: dir, stdio: "pipe", shell: true,
    });

    // Wait for server ready
    const start = Date.now();
    while (Date.now() - start < 30000) {
      try {
        const res = await fetch(`http://localhost:${port}`);
        if (res.ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }

    this.devServers.set(projectName, { process: proc, port });
    return port;
  }

  async rebuildAndRestart(projectName: string): Promise<void> {
    const srv = this.devServers.get(projectName);
    if (!srv) return;
    const dir = this.projectDir(projectName);
    const port = srv.port;

    // Kill old server
    srv.process.kill();
    this.devServers.delete(projectName);

    // Rebuild and restart
    await execAsync("npm run build", { cwd: dir, timeout: 120000 });

    const proc = spawn("npx", ["next", "start", "--port", String(port)], {
      cwd: dir, stdio: "pipe", shell: true,
    });

    // Wait for server ready
    const start = Date.now();
    while (Date.now() - start < 30000) {
      try {
        const res = await fetch(`http://localhost:${port}`);
        if (res.ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }

    this.devServers.set(projectName, { process: proc, port });
  }

  stopDevServer(projectName: string): void {
    const srv = this.devServers.get(projectName);
    if (srv) {
      srv.process.kill();
      this.devServers.delete(projectName);
    }
  }

  getDevServerPort(projectName: string): number | null {
    return this.devServers.get(projectName)?.port ?? null;
  }

  stopAll(): void {
    for (const [name] of this.devServers) {
      this.stopDevServer(name);
    }
  }
}

function pascal(s: string): string {
  return s.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
}
