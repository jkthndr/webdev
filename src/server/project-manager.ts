import { ProjectWorkspaceService, type ProjectInfo } from "./workspace.js";
import { ProjectCheckpointService } from "./checkpoint.js";
import { PreviewRuntimeService } from "./preview-runtime.js";

export type { ProjectInfo };

/**
 * Thin facade that delegates to focused services.
 * Consumers can use this for backward compatibility, or import services directly.
 */
export class ProjectManager {
  readonly workspace: ProjectWorkspaceService;
  readonly checkpoints: ProjectCheckpointService;
  readonly runtime: PreviewRuntimeService;

  constructor() {
    this.workspace = new ProjectWorkspaceService();
    this.checkpoints = new ProjectCheckpointService(this.workspace);
    this.runtime = new PreviewRuntimeService(this.workspace);
  }

  // --- Workspace delegates ---

  listProjects(): ProjectInfo[] {
    return this.workspace.listProjects();
  }

  getProjectInfo(name: string): ProjectInfo | null {
    return this.workspace.getProjectInfo(name);
  }

  async openOrCreate(name: string): Promise<ProjectInfo> {
    return this.workspace.openOrCreate(name);
  }

  listScreens(name: string): string[] {
    return this.workspace.listScreens(name);
  }

  createScreen(projectName: string, screenName: string, code?: string): string {
    return this.workspace.createScreen(projectName, screenName, code);
  }

  readScreenCode(projectName: string, screenName: string): string | null {
    return this.workspace.readScreenCode(projectName, screenName);
  }

  editScreenCode(projectName: string, screenName: string, code: string): string {
    return this.workspace.editScreenCode(projectName, screenName, code);
  }

  // --- Checkpoint delegates ---

  checkpoint(projectName: string, message: string): string {
    return this.checkpoints.checkpoint(projectName, message);
  }

  restoreCheckpoint(projectName: string, hash: string): void {
    return this.checkpoints.restoreCheckpoint(projectName, hash);
  }

  getCheckpoints(projectName: string): { hash: string; message: string; date: string }[] {
    return this.checkpoints.getCheckpoints(projectName);
  }

  getCurrentHash(projectName: string): string | null {
    return this.checkpoints.getCurrentHash(projectName);
  }

  // --- Runtime delegates ---

  async startDevServer(projectName: string): Promise<number> {
    return this.runtime.startDevServer(projectName);
  }

  async rebuildAndRestart(projectName: string): Promise<void> {
    return this.runtime.rebuildAndRestart(projectName);
  }

  stopDevServer(projectName: string): void {
    return this.runtime.stopDevServer(projectName);
  }

  getDevServerPort(projectName: string): number | null {
    return this.runtime.getDevServerPort(projectName);
  }

  isStarting(projectName: string): boolean {
    return this.runtime.isStarting(projectName);
  }

  async switchToDevMode(projectName: string): Promise<number> {
    return this.runtime.switchToDevMode(projectName);
  }

  getDevServerMode(projectName: string): "production" | "development" | null {
    return this.runtime.getDevServerMode(projectName);
  }

  stopAll(): void {
    return this.runtime.stopAll();
  }
}
