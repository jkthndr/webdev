import * as fs from "fs";
import * as path from "path";
import type { DesignBrief } from "./design-brief.js";
import type { ProjectWorkspaceService } from "./workspace.js";

export interface FeedbackAnnotation {
  id: string;
  screen: string;
  x: number;
  y: number;
  text: string;
  author: string;
  createdAt: string;
  resolved: boolean;
}

export interface GenerationContext {
  project: string;
  screen: string | null;
  screens: string[];
  designBrief: DesignBrief | null;
  unresolvedFeedback: FeedbackAnnotation[];
  screenCode: string | null;
  generatedAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asFeedback(value: unknown): FeedbackAnnotation[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item) => ({
    id: typeof item.id === "string" ? item.id : "",
    screen: typeof item.screen === "string" ? item.screen : "",
    x: typeof item.x === "number" ? item.x : 0,
    y: typeof item.y === "number" ? item.y : 0,
    text: typeof item.text === "string" ? item.text : "",
    author: typeof item.author === "string" ? item.author : "human",
    createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
    resolved: Boolean(item.resolved),
  })).filter((item) => item.id && item.screen && item.text);
}

export class GenerationContextService {
  constructor(private workspace: ProjectWorkspaceService) {}

  readFeedback(projectName: string): FeedbackAnnotation[] {
    const file = path.join(this.workspace.projectDir(projectName), ".studio", "feedback.json");
    if (!fs.existsSync(file)) return [];
    try {
      return asFeedback(JSON.parse(fs.readFileSync(file, "utf-8")) as unknown);
    } catch {
      return [];
    }
  }

  buildContext(projectName: string, opts: { screen?: string | null; designBrief: DesignBrief | null }): GenerationContext {
    const screen = opts.screen || null;
    const screens = this.workspace.listScreens(projectName);
    const unresolvedFeedback = this.readFeedback(projectName)
      .filter((item) => !item.resolved)
      .filter((item) => !screen || item.screen === screen);
    const screenCode = screen ? this.workspace.readScreenCode(projectName, screen) : null;

    return {
      project: projectName,
      screen,
      screens,
      designBrief: opts.designBrief,
      unresolvedFeedback,
      screenCode,
      generatedAt: new Date().toISOString(),
    };
  }
}
