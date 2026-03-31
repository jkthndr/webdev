import { execSync } from "child_process";
import type { ProjectWorkspaceService } from "./workspace.js";

function sanitizeForShell(s: string): string {
  return s.replace(/[^a-zA-Z0-9 .,!?:;_\-()]/g, "");
}

/**
 * Manages git checkpoints (commit, restore, list, current hash).
 */
export class ProjectCheckpointService {
  constructor(private workspace: ProjectWorkspaceService) {}

  checkpoint(projectName: string, message: string): string {
    const dir = this.workspace.projectDir(projectName);
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
    const dir = this.workspace.projectDir(projectName);
    execSync(`git reset --hard ${hash}`, { cwd: dir, stdio: "pipe" });
  }

  getCheckpoints(projectName: string): { hash: string; message: string; date: string }[] {
    const dir = this.workspace.projectDir(projectName);
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

  getCurrentHash(projectName: string): string | null {
    const dir = this.workspace.projectDir(projectName);
    try {
      return execSync("git rev-parse HEAD", { cwd: dir, encoding: "utf-8" }).trim();
    } catch {
      return null;
    }
  }
}
