import { execSync } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";
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

function resolveTemplateDir(): string {
  const candidates = [
    path.resolve(import.meta.dirname, "../template"),
    path.resolve(process.cwd(), "src/template"),
    path.resolve(process.cwd(), "dist/template"),
  ];
  const found = candidates.find((c) => fs.existsSync(path.join(c, "package.json")));
  if (!found) {
    throw new Error(`Project template directory not found. Looked in: ${candidates.join(", ")}`);
  }
  return found;
}

const TEMPLATE_DIR = resolveTemplateDir();

const VALID_NAME = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;

export function validateName(name: string, label: string): void {
  if (!VALID_NAME.test(name)) {
    throw new Error(`Invalid ${label} name '${name}': must be alphanumeric with hyphens/underscores, 1-64 chars`);
  }
}

function pascal(s: string): string {
  return s.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
}

/**
 * Manages project filesystem structure, scaffolding, and screen CRUD.
 */
export class ProjectWorkspaceService {
  constructor() {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  }

  projectDir(name: string): string {
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
      fs.cpSync(TEMPLATE_DIR, dir, { recursive: true });
      execSync("git init", { cwd: dir, stdio: "pipe" });
      execSync("git add -A", { cwd: dir, stdio: "pipe" });
      execSync('git commit -m "Initial project scaffold"', { cwd: dir, stdio: "pipe" });
    }

    if (!hasNodeModules) {
      // Use npm ci for reproducible installs when lockfile exists
      const hasLockfile = fs.existsSync(path.join(dir, "package-lock.json"));
      const installCmd = hasLockfile ? "npm ci --include=dev" : "npm install --include=dev";
      // Force NODE_ENV=development for the install so devDependencies (tailwindcss,
      // @tailwindcss/postcss, etc.) come along even when the host container runs
      // with NODE_ENV=production. The Next build inside the project needs them.
      await execAsync(installCmd, {
        cwd: dir,
        timeout: 120000,
        env: { ...process.env, NODE_ENV: "development" },
      });
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
}
