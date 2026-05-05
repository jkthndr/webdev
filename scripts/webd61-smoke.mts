import fs from "fs";
import path from "path";
import { ProjectManager } from "../src/server/project-manager.ts";

const name = "webd61-smoke";
const root = path.resolve("projects", name);

function removeSmokeProject(): void {
  if (!root.startsWith(path.resolve("projects"))) {
    throw new Error(`Refusing to remove unexpected path: ${root}`);
  }
  if (fs.existsSync(root)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function assert(cond: boolean, message: string): void {
  if (!cond) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

removeSmokeProject();

const pm = new ProjectManager();

try {
  await pm.openOrCreate(name);

  // Case 1: no brief saved yet
  const noBrief = pm.createScreenFromBrief(name, "splash");
  assert(noBrief.brief === null, "brief should be null when none saved");
  assert(noBrief.matchedRoute === null, "matchedRoute should be null when no brief");
  assert(noBrief.warnings.some((w) => w.includes("No design brief")), "should warn when no brief");
  const splashCode = fs.readFileSync(noBrief.file, "utf-8");
  assert(splashCode.includes("Screen: splash"), "splash file should include screen header");
  assert(splashCode.includes("export default function SplashScreen()"), "splash file should export PascalCase component");

  // Case 2: brief with a matching route
  pm.saveDesignBrief(name, {
    title: "Acme Studio",
    summary: "Design tool for product teams.",
    audience: "Product managers and designers at small SaaS teams.",
    goals: ["Convey value fast", "Drive trial signups"],
    tone: ["warm", "confident"],
    mustHaves: ["Hero with primary CTA", "Pricing teaser"],
    avoid: ["Carousels", "Stock photos"],
    routes: [{ name: "home", purpose: "Landing for first-time visitors", status: "draft" }],
    inspiration: [],
    notes: "",
  });

  const matched = pm.createScreenFromBrief(name, "home");
  assert(matched.brief !== null, "brief should be loaded");
  assert(matched.matchedRoute !== null, "should match the home route");
  assert(matched.matchedRoute?.purpose === "Landing for first-time visitors", "matched route purpose");
  assert(matched.warnings.length === 0, `expected no warnings, got: ${JSON.stringify(matched.warnings)}`);
  const homeCode = fs.readFileSync(matched.file, "utf-8");
  assert(homeCode.includes("Project: Acme Studio"), "home file should include project title");
  assert(homeCode.includes("Purpose: Landing for first-time visitors"), "home file should include matched route purpose");
  assert(homeCode.includes("Audience: Product managers"), "home file should include audience");
  assert(homeCode.includes("- Convey value fast"), "home file should list goals");
  assert(homeCode.includes("- Hero with primary CTA"), "home file should list must-haves");
  assert(homeCode.includes("- Carousels"), "home file should list avoid items");
  assert(homeCode.includes("Tone: warm, confident"), "home file should include tone");
  assert(homeCode.includes("export default function HomeScreen()"), "home file should export PascalCase component");

  // Case 2b: brief text that includes a block-comment terminator should not break TSX
  pm.saveDesignBrief(name, {
    title: "Comment breaker */ project",
    summary: "Summary with newline\nand terminator */ inside.",
    audience: "Reviewers",
    goals: ["Keep generated TSX valid even with */ in user text"],
    tone: [],
    mustHaves: [],
    avoid: [],
    routes: [{ name: "legal", purpose: "Purpose includes */ terminator", status: "draft" }],
    inspiration: [],
    notes: "",
  });
  const legal = pm.createScreenFromBrief(name, "legal");
  const legalCode = fs.readFileSync(legal.file, "utf-8");
  assert(legalCode.includes("Comment breaker * / project"), "comment terminator should be escaped in title");
  assert(legalCode.includes("Purpose includes * / terminator"), "comment terminator should be escaped in purpose");
  assert(!legalCode.includes("*/ project"), "raw embedded comment terminator should not remain");

  // Restore the original full brief for the undeclared-route case.
  pm.saveDesignBrief(name, {
    title: "Acme Studio",
    summary: "Design tool for product teams.",
    audience: "Product managers and designers at small SaaS teams.",
    goals: ["Convey value fast", "Drive trial signups"],
    tone: ["warm", "confident"],
    mustHaves: ["Hero with primary CTA", "Pricing teaser"],
    avoid: ["Carousels", "Stock photos"],
    routes: [{ name: "home", purpose: "Landing for first-time visitors", status: "draft" }],
    inspiration: [],
    notes: "",
  });

  // Case 3: brief saved but screen name does not match any declared route
  const unknown = pm.createScreenFromBrief(name, "settings");
  assert(unknown.brief !== null, "brief should be loaded");
  assert(unknown.matchedRoute === null, "should not match any route");
  assert(unknown.warnings.some((w) => w.includes("not declared")), "should warn about undeclared route");
  const settingsCode = fs.readFileSync(unknown.file, "utf-8");
  assert(settingsCode.includes("Project: Acme Studio"), "settings file should still include project title");
  assert(settingsCode.includes("Project summary: Design tool"), "settings file should fall back to project summary when no matching route");

  console.log(JSON.stringify({
    smoke: "WEBD-61 create_screen_from_brief",
    cases: 4,
    files: [noBrief.file, matched.file, legal.file, unknown.file].map((f) => path.relative(process.cwd(), f).replace(/\\/g, "/")),
    result: "ok",
  }, null, 2));
} finally {
  pm.stopAll();
  removeSmokeProject();
}
