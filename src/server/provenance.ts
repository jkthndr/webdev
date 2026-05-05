import * as fs from "fs";
import * as path from "path";

export type BundledSeedType = "project-template" | "web-skill" | "style-recipe" | "component-seed";

export interface ThirdPartyNotice {
  name: string;
  license: string;
  usage: string;
}

export interface CleanRoomMetadata {
  original: boolean;
  copiedThirdPartyMaterial: boolean;
  reviewNotes: string;
}

export interface BundledSeedProvenance {
  version: 1;
  id: string;
  type: BundledSeedType;
  name: string;
  author: string;
  license: string;
  created: string;
  sourceNotes: string;
  files: string[];
  cleanRoom: CleanRoomMetadata;
  thirdParty?: ThirdPartyNotice[];
}

export interface ProvenanceSource {
  kind: "project-template" | "skills";
  path: string;
}

export interface ProvenanceIssue {
  severity: "error" | "warning";
  path: string;
  itemId?: string;
  message: string;
}

export interface BundledSeedProvenanceReport {
  generatedAt: string;
  items: BundledSeedProvenance[];
  sources: ProvenanceSource[];
  issues: ProvenanceIssue[];
}

const KNOWN_TYPES = new Set<BundledSeedType>([
  "project-template",
  "web-skill",
  "style-recipe",
  "component-seed",
]);

const REQUIRED_STRINGS: Array<keyof BundledSeedProvenance> = [
  "id",
  "type",
  "name",
  "author",
  "license",
  "created",
  "sourceNotes",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function relativePath(filePath: string): string {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
}

function firstExistingDirectory(candidates: string[]): string | null {
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) ?? null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asThirdPartyNotices(value: unknown): ThirdPartyNotice[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const notices = value
    .filter(isRecord)
    .map((notice) => ({
      name: String(notice.name ?? ""),
      license: String(notice.license ?? ""),
      usage: String(notice.usage ?? ""),
    }))
    .filter((notice) => notice.name && notice.license && notice.usage);
  return notices.length > 0 ? notices : undefined;
}

function asCleanRoomMetadata(value: unknown): CleanRoomMetadata | null {
  if (!isRecord(value)) return null;
  return {
    original: value.original === true,
    copiedThirdPartyMaterial: value.copiedThirdPartyMaterial === true,
    reviewNotes: typeof value.reviewNotes === "string" ? value.reviewNotes : "",
  };
}

function rawItemsFromFile(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (!isRecord(parsed)) return [];
  if (Array.isArray(parsed.items)) return parsed.items;
  return [parsed];
}

export class BundledProvenanceService {
  private readonly templateCandidates = [
    path.resolve(import.meta.dirname, "../template"),
    path.resolve(process.cwd(), "src/template"),
  ];

  private readonly skillsCandidates = [
    path.resolve(process.cwd(), "skills"),
    path.resolve(process.cwd(), "src/skills"),
    path.resolve(import.meta.dirname, "../skills"),
  ];

  loadReport(): BundledSeedProvenanceReport {
    const sources = this.findSources();
    const issues: ProvenanceIssue[] = [];
    const items = sources.flatMap((source) => this.readSource(source, issues));

    return {
      generatedAt: new Date().toISOString(),
      items,
      sources: sources.map((source) => ({
        ...source,
        path: relativePath(source.path),
      })),
      issues,
    };
  }

  getItem(id: string): BundledSeedProvenance | null {
    return this.loadReport().items.find((item) => item.id === id) ?? null;
  }

  private findSources(): ProvenanceSource[] {
    const sources: ProvenanceSource[] = [];
    const templateDir = firstExistingDirectory(this.templateCandidates);
    if (templateDir) {
      const templateProvenance = path.join(templateDir, ".webdev", "provenance.json");
      if (fs.existsSync(templateProvenance)) {
        sources.push({ kind: "project-template", path: templateProvenance });
      }
    }

    const skillsDir = firstExistingDirectory(this.skillsCandidates);
    if (skillsDir) {
      for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const skillDir = path.join(skillsDir, entry.name);
        for (const candidate of [
          path.join(skillDir, "provenance.json"),
          path.join(skillDir, ".webdev", "provenance.json"),
        ]) {
          if (fs.existsSync(candidate)) {
            sources.push({ kind: "skills", path: candidate });
          }
        }
      }
    }

    return sources;
  }

  private readSource(source: ProvenanceSource, issues: ProvenanceIssue[]): BundledSeedProvenance[] {
    const sourcePath = relativePath(source.path);
    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(source.path, "utf-8"));
    } catch (error) {
      issues.push({
        severity: "error",
        path: sourcePath,
        message: `Could not read provenance metadata: ${error instanceof Error ? error.message : String(error)}`,
      });
      return [];
    }

    return rawItemsFromFile(parsed)
      .map((raw) => this.normalizeItem(raw, sourcePath, issues))
      .filter((item): item is BundledSeedProvenance => item !== null);
  }

  private normalizeItem(
    raw: unknown,
    sourcePath: string,
    issues: ProvenanceIssue[],
  ): BundledSeedProvenance | null {
    if (!isRecord(raw)) {
      issues.push({ severity: "error", path: sourcePath, message: "Provenance item must be an object." });
      return null;
    }

    const itemId = typeof raw.id === "string" ? raw.id : undefined;
    const missing = REQUIRED_STRINGS.filter((field) => {
      const value = raw[field];
      return typeof value !== "string" || value.trim().length === 0;
    });

    if (missing.length > 0) {
      issues.push({
        severity: "error",
        path: sourcePath,
        itemId,
        message: `Missing required provenance field(s): ${missing.join(", ")}`,
      });
      return null;
    }

    if (!KNOWN_TYPES.has(raw.type as BundledSeedType)) {
      issues.push({
        severity: "error",
        path: sourcePath,
        itemId,
        message: `Unknown bundled seed type: ${String(raw.type)}`,
      });
      return null;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(raw.created))) {
      issues.push({
        severity: "warning",
        path: sourcePath,
        itemId,
        message: "created should use YYYY-MM-DD format.",
      });
    }

    const cleanRoom = asCleanRoomMetadata(raw.cleanRoom);
    if (!cleanRoom) {
      issues.push({ severity: "error", path: sourcePath, itemId, message: "Missing cleanRoom metadata." });
      return null;
    }

    if (!cleanRoom.original || cleanRoom.copiedThirdPartyMaterial) {
      issues.push({
        severity: "warning",
        path: sourcePath,
        itemId,
        message: "Clean-room metadata does not mark this item as original-only.",
      });
    }

    return {
      version: 1,
      id: String(raw.id),
      type: raw.type as BundledSeedType,
      name: String(raw.name),
      author: String(raw.author),
      license: String(raw.license),
      created: String(raw.created),
      sourceNotes: String(raw.sourceNotes),
      files: asStringArray(raw.files),
      cleanRoom,
      thirdParty: asThirdPartyNotices(raw.thirdParty),
    };
  }
}
