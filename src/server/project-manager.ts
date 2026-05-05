import { ProjectWorkspaceService, type ProjectInfo } from "./workspace.js";
import { ProjectCheckpointService } from "./checkpoint.js";
import { DesignBriefService, type DesignBrief, type DesignBriefInput, type DesignBriefRoute } from "./design-brief.js";
import { GenerationContextService, type GenerationContext } from "./generation-context.js";
import { BundledProvenanceService, type BundledSeedProvenance, type BundledSeedProvenanceReport } from "./provenance.js";
import { ProjectProofService, type ProofRun, type ProofRunOptions } from "./proof.js";
import { PreviewRuntimeService } from "./preview-runtime.js";

export type { ProjectInfo };
export type { DesignBrief, DesignBriefInput };
export type { GenerationContext };
export type { BundledSeedProvenance, BundledSeedProvenanceReport };
export type { ProofRun, ProofRunOptions };

export interface CreateScreenFromBriefResult {
  file: string;
  route: string;
  screen: string;
  brief: DesignBrief | null;
  matchedRoute: DesignBriefRoute | null;
  warnings: string[];
}

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

  createScreenFromBrief(projectName: string, screenName: string): CreateScreenFromBriefResult {
    const brief = this.getDesignBrief(projectName);
    const warnings: string[] = [];

    if (!brief) {
      warnings.push("No design brief saved for this project. Scaffolding without brief context.");
    } else if (!brief.title.trim() && !brief.summary.trim()) {
      warnings.push("Design brief is empty. Scaffolding without brief context.");
    }

    const matchedRoute = brief
      ? brief.routes.find((r) => r.name.toLowerCase() === screenName.toLowerCase()) ?? null
      : null;

    if (brief && !matchedRoute) {
      warnings.push(`Screen '${screenName}' is not declared in the design brief routes. Add it via set_design_brief if intended.`);
    }

    const code = renderBriefAwareSeed(screenName, brief, matchedRoute);
    const file = this.workspace.createScreen(projectName, screenName, code);

    return {
      file,
      route: `/screens/${screenName}`,
      screen: screenName,
      brief,
      matchedRoute,
      warnings,
    };
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

function pascalCase(s: string): string {
  return s.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
}

function renderBriefAwareSeed(
  screenName: string,
  brief: DesignBrief | null,
  matchedRoute: DesignBriefRoute | null,
): string {
  const lines: string[] = [];
  lines.push("/**");
  lines.push(` * Screen: ${screenName}`);
  if (brief && brief.title.trim()) {
    lines.push(` * Project: ${brief.title}`);
  }
  if (matchedRoute && matchedRoute.purpose.trim()) {
    lines.push(" *");
    lines.push(` * Purpose: ${matchedRoute.purpose}`);
  } else if (brief && brief.summary.trim()) {
    lines.push(" *");
    lines.push(` * Project summary: ${brief.summary}`);
  }
  if (brief && brief.audience.trim()) {
    lines.push(` * Audience: ${brief.audience}`);
  }
  if (brief && brief.goals.length > 0) {
    lines.push(" *");
    lines.push(" * Goals:");
    for (const goal of brief.goals) {
      lines.push(` *   - ${goal}`);
    }
  }
  if (brief && brief.mustHaves.length > 0) {
    lines.push(" *");
    lines.push(" * Must have:");
    for (const item of brief.mustHaves) {
      lines.push(` *   - ${item}`);
    }
  }
  if (brief && brief.avoid.length > 0) {
    lines.push(" *");
    lines.push(" * Avoid:");
    for (const item of brief.avoid) {
      lines.push(` *   - ${item}`);
    }
  }
  if (brief && brief.tone.length > 0) {
    lines.push(" *");
    lines.push(` * Tone: ${brief.tone.join(", ")}`);
  }
  lines.push(" *");
  lines.push(" * Replace this scaffold with the actual TSX. Keep the brief header if useful.");
  lines.push(" */");
  lines.push("");

  const componentName = pascalCase(screenName);
  lines.push(`export default function ${componentName}Screen() {`);
  lines.push("  return (");
  lines.push('    <div className="min-h-screen p-8">');
  lines.push(`      <h1 className="text-3xl font-bold">${screenName}</h1>`);
  lines.push('      <p className="text-muted-foreground mt-2">Scaffolded from design brief. Implement per header.</p>');
  lines.push("    </div>");
  lines.push("  );");
  lines.push("}");
  lines.push("");

  return lines.join("\n");
}
