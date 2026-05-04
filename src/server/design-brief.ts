import * as fs from "fs";
import * as path from "path";
import type { ProjectWorkspaceService } from "./workspace.js";

export const DESIGN_BRIEF_VERSION = 1;

export interface DesignBriefRoute {
  name: string;
  purpose: string;
  status: "planned" | "draft" | "approved";
}

export interface DesignBrief {
  version: typeof DESIGN_BRIEF_VERSION;
  project: string;
  title: string;
  summary: string;
  audience: string;
  goals: string[];
  tone: string[];
  mustHaves: string[];
  avoid: string[];
  routes: DesignBriefRoute[];
  inspiration: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type DesignBriefInput = Partial<Omit<DesignBrief, "version" | "project" | "createdAt" | "updatedAt">>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asRoutes(value: unknown): DesignBriefRoute[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((route) => {
    const status: DesignBriefRoute["status"] =
      route.status === "draft" || route.status === "approved" ? route.status : "planned";
    return {
      name: asString(route.name),
      purpose: asString(route.purpose),
      status,
    };
  }).filter((route) => route.name.length > 0);
}

function normalizeBrief(project: string, value: unknown): DesignBrief {
  const now = new Date().toISOString();
  if (!isRecord(value)) return createEmptyBrief(project, now);

  const createdAt = asString(value.createdAt, now);
  return {
    version: DESIGN_BRIEF_VERSION,
    project,
    title: asString(value.title),
    summary: asString(value.summary),
    audience: asString(value.audience),
    goals: asStringArray(value.goals),
    tone: asStringArray(value.tone),
    mustHaves: asStringArray(value.mustHaves),
    avoid: asStringArray(value.avoid),
    routes: asRoutes(value.routes),
    inspiration: asStringArray(value.inspiration),
    notes: asString(value.notes),
    createdAt,
    updatedAt: asString(value.updatedAt, createdAt),
  };
}

function createEmptyBrief(project: string, timestamp = new Date().toISOString()): DesignBrief {
  return {
    version: DESIGN_BRIEF_VERSION,
    project,
    title: "",
    summary: "",
    audience: "",
    goals: [],
    tone: [],
    mustHaves: [],
    avoid: [],
    routes: [],
    inspiration: [],
    notes: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export class DesignBriefService {
  constructor(private workspace: ProjectWorkspaceService) {}

  private projectDir(projectName: string): string {
    const dir = this.workspace.projectDir(projectName);
    if (!fs.existsSync(path.join(dir, "package.json"))) {
      throw new Error(`Project '${projectName}' not found`);
    }
    return dir;
  }

  briefPath(projectName: string): string {
    return path.join(this.projectDir(projectName), ".studio", "design-brief.json");
  }

  getDesignBrief(projectName: string): DesignBrief | null {
    const file = this.briefPath(projectName);
    if (!fs.existsSync(file)) return null;
    const raw = JSON.parse(fs.readFileSync(file, "utf-8")) as unknown;
    return normalizeBrief(projectName, raw);
  }

  getOrCreateDesignBrief(projectName: string): DesignBrief {
    return this.getDesignBrief(projectName) ?? createEmptyBrief(projectName);
  }

  saveDesignBrief(projectName: string, input: DesignBriefInput): DesignBrief {
    const existing = this.getOrCreateDesignBrief(projectName);
    const now = new Date().toISOString();
    const next: DesignBrief = {
      ...existing,
      ...input,
      version: DESIGN_BRIEF_VERSION,
      project: projectName,
      routes: input.routes ? asRoutes(input.routes) : existing.routes,
      goals: input.goals ? asStringArray(input.goals) : existing.goals,
      tone: input.tone ? asStringArray(input.tone) : existing.tone,
      mustHaves: input.mustHaves ? asStringArray(input.mustHaves) : existing.mustHaves,
      avoid: input.avoid ? asStringArray(input.avoid) : existing.avoid,
      inspiration: input.inspiration ? asStringArray(input.inspiration) : existing.inspiration,
      createdAt: existing.createdAt,
      updatedAt: now,
    };

    const file = this.briefPath(projectName);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmpFile = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmpFile, `${JSON.stringify(next, null, 2)}\n`);
    fs.renameSync(tmpFile, file);
    return next;
  }
}
