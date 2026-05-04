import { ProjectWorkspaceService, type ProjectInfo } from "./workspace.js";
import { ProjectCheckpointService } from "./checkpoint.js";
import { DesignBriefService, type DesignBrief, type DesignBriefInput } from "./design-brief.js";
import { GenerationContextService, type GenerationContext } from "./generation-context.js";
import { BundledProvenanceService, type BundledSeedProvenance, type BundledSeedProvenanceReport } from "./provenance.js";
import { ProjectProofService, type ProofRun, type ProofRunOptions } from "./proof.js";
import { PreviewRuntimeService } from "./preview-runtime.js";

export type { ProjectInfo };
export type { DesignBrief, DesignBriefInput };
export type { GenerationContext };
export type { BundledSeedProvenance, BundledSeedProvenanceReport };
export type { ProofRun, ProofRunOptions };

/**
 * Thin facade that delegates to focused services.
 * Consumers can use this for backward compatibility, or import services directly.
 */
export class ProjectManager {
  readonly workspace: ProjectWorkspaceService;
  readonly checkpoints: ProjectCheckpointService;
  readonly designBriefs: DesignBriefService;
  readonly generationContext: GenerationContextService;
  readonly provenance: BundledProvenanceService;
  readonly runtime: PreviewRuntimeService;
  readonly proofs: ProjectProofService;

  constructor() {
    this.workspace = new ProjectWorkspaceService();
    this.checkpoints = new ProjectCheckpointService(this.workspace);
    this.designBriefs = new DesignBriefService(this.workspace);
    this.generationContext = new GenerationContextService(this.workspace);
    this.provenance = new BundledProvenanceService();
    this.runtime = new PreviewRuntimeService(this.workspace);
    this.proofs = new ProjectProofService(this.workspace, this.runtime, this.checkpoints);
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

  // --- Design brief delegates ---

  getDesignBrief(projectName: string): DesignBrief | null {
    return this.designBriefs.getDesignBrief(projectName);
  }

  getOrCreateDesignBrief(projectName: string): DesignBrief {
    return this.designBriefs.getOrCreateDesignBrief(projectName);
  }

  saveDesignBrief(projectName: string, input: DesignBriefInput): DesignBrief {
    return this.designBriefs.saveDesignBrief(projectName, input);
  }

  getGenerationContext(projectName: string, screenName?: string | null): GenerationContext {
    return this.generationContext.buildContext(projectName, {
      screen: screenName,
      designBrief: this.getDesignBrief(projectName),
    });
  }

  // --- Bundled seed provenance delegates ---

  getBundledSeedProvenanceReport(): BundledSeedProvenanceReport {
    return this.provenance.loadReport();
  }

  getBundledSeedProvenance(id: string): BundledSeedProvenance | null {
    return this.provenance.getItem(id);
  }

  // --- Proof run delegates ---

  async runProof(projectName: string, screenName: string, options?: ProofRunOptions): Promise<ProofRun> {
    return this.proofs.runProof(projectName, screenName, options);
  }

  listProofRuns(projectName: string): ProofRun[] {
    return this.proofs.listProofRuns(projectName);
  }

  getProofRun(projectName: string, id: string): ProofRun | null {
    return this.proofs.getProofRun(projectName, id);
  }

  getProofScreenshotPath(projectName: string, id: string): string | null {
    return this.proofs.getProofScreenshotPath(projectName, id);
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
