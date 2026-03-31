import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import express from "express";
import { ProjectManager } from "./project-manager.js";
import { takeScreenshot, closeBrowser } from "./screenshot.js";

const pm = new ProjectManager();
const PREVIEW_BASE_PORT = 4501;
let nextPort = PREVIEW_BASE_PORT;

// --- MCP Server Factory ---

function createMcpServerWithTools(): McpServer {
  const mcp = new McpServer({
    name: "webdev-design-tool",
    version: "0.1.0",
  });

  // Tool 1: open_project
  mcp.tool(
    "open_project",
    "Open or create a design project (Next.js + shadcn/ui workspace)",
    { name: z.string().describe("Project name (alphanumeric + hyphens)") },
    async ({ name }) => {
      const project = await pm.openOrCreate(name);
      const port = await pm.startDevServer(name, nextPort++);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            project: project.name,
            screens: project.screens,
            previewUrl: `http://localhost:${port}`,
            checkpoints: pm.getCheckpoints(name).length,
          }, null, 2),
        }],
      };
    }
  );

  // Tool 2: create_screen
  mcp.tool(
    "create_screen",
    "Scaffold a new TSX screen with route in the current project",
    {
      project: z.string().describe("Project name"),
      screen: z.string().describe("Screen name (becomes the route, e.g. 'login' -> /screens/login)"),
      code: z.string().optional().describe("Optional TSX code. If omitted, creates a starter template."),
    },
    async ({ project, screen, code }) => {
      const filePath = pm.createScreen(project, screen, code);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            created: screen,
            file: filePath,
            route: `/screens/${screen}`,
            screens: pm.listScreens(project),
          }, null, 2),
        }],
      };
    }
  );

  // Tool 3: edit_screen_code
  mcp.tool(
    "edit_screen_code",
    "Replace the TSX code for a screen. Provide the complete new file content.",
    {
      project: z.string().describe("Project name"),
      screen: z.string().describe("Screen name"),
      code: z.string().describe("Complete new TSX code for the screen"),
    },
    async ({ project, screen, code }) => {
      const existing = pm.readScreenCode(project, screen);
      if (existing === null) {
        return {
          content: [{ type: "text" as const, text: `Error: Screen '${screen}' not found in project '${project}'` }],
          isError: true,
        };
      }
      const filePath = pm.editScreenCode(project, screen, code);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            updated: screen,
            file: filePath,
            previousSize: existing.length,
            newSize: code.length,
          }, null, 2),
        }],
      };
    }
  );

  // Tool 4: render_screenshot
  mcp.tool(
    "render_screenshot",
    "Take a Playwright screenshot of a screen. Returns base64-encoded PNG.",
    {
      project: z.string().describe("Project name"),
      screen: z.string().describe("Screen name to screenshot"),
      viewport: z.object({
        width: z.number().default(1280),
        height: z.number().default(800),
      }).optional().describe("Viewport size (default 1280x800)"),
    },
    async ({ project, screen, viewport }) => {
      const port = pm.getDevServerPort(project);
      if (!port) {
        return {
          content: [{ type: "text" as const, text: `Error: No dev server running for '${project}'. Call open_project first.` }],
          isError: true,
        };
      }

      try {
        await pm.rebuildAndRestart(project);
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Build error: ${e instanceof Error ? e.message : String(e)}` }],
          isError: true,
        };
      }

      const url = `http://localhost:${port}/screens/${screen}`;
      const buffer = await takeScreenshot({
        url,
        viewport: viewport ?? { width: 1280, height: 800 },
      });

      return {
        content: [{
          type: "image" as const,
          data: buffer.toString("base64"),
          mimeType: "image/png",
        }],
      };
    }
  );

  // Tool 5: list_screens
  mcp.tool(
    "list_screens",
    "List all screens in a project",
    { project: z.string().describe("Project name") },
    async ({ project }) => {
      const screens = pm.listScreens(project);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            project,
            screens,
            count: screens.length,
            previewPort: pm.getDevServerPort(project),
          }, null, 2),
        }],
      };
    }
  );

  // Tool 6: checkpoint
  mcp.tool(
    "checkpoint",
    "Git commit current project state (safe experimentation point)",
    {
      project: z.string().describe("Project name"),
      message: z.string().describe("Checkpoint description"),
    },
    async ({ project, message }) => {
      const hash = pm.checkpoint(project, message);
      const checkpoints = pm.getCheckpoints(project);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            checkpoint: hash,
            message,
            totalCheckpoints: checkpoints.length,
          }, null, 2),
        }],
      };
    }
  );

  // Tool 7: restore_checkpoint
  mcp.tool(
    "restore_checkpoint",
    "Restore project to a previous checkpoint (git reset)",
    {
      project: z.string().describe("Project name"),
      hash: z.string().describe("Checkpoint hash to restore to (from checkpoint tool output)"),
    },
    async ({ project, hash }) => {
      pm.restoreCheckpoint(project, hash);
      const screens = pm.listScreens(project);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ restored: hash, screens }, null, 2),
        }],
      };
    }
  );

  return mcp;
}

// --- HTTP Server with Streamable HTTP MCP Transport ---

const app = express();
app.use(express.json());

const HTTP_PORT = parseInt(process.env.HTTP_PORT || "4500");

// Session management
const transports: Record<string, StreamableHTTPServerTransport> = {};

// MCP endpoint — POST (handles JSON-RPC requests)
app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  try {
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports[sid] = transport;
          console.error(`[webdev] MCP session initialized: ${sid}`);
        },
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          delete transports[sid];
          console.error(`[webdev] MCP session closed: ${sid}`);
        }
      };

      const server = createMcpServerWithTools();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: No valid session ID provided" },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("[webdev] MCP error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// MCP endpoint — GET (SSE stream for server-to-client notifications)
app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  await transports[sessionId].handleRequest(req, res);
});

// MCP endpoint — DELETE (session termination)
app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  await transports[sessionId].handleRequest(req, res);
});

// Health check
app.get("/api/health", (_req, res) => {
  const projects = pm.listProjects();
  const totalScreens = projects.reduce((sum, p) => sum + p.screens.length, 0);
  res.json({
    status: "ok",
    projects: projects.length,
    screens: totalScreens,
    version: "0.1.0",
  });
});

// Projects list
app.get("/api/projects", (_req, res) => {
  res.json(pm.listProjects());
});

// Root — basic info instead of 404
app.get("/", (_req, res) => {
  res.json({
    name: "webdev-design-tool",
    version: "0.1.0",
    mcp: "/mcp",
    health: "/api/health",
  });
});

// --- Start ---

app.listen(HTTP_PORT, "0.0.0.0", () => {
  console.error(`[webdev] MCP server on http://0.0.0.0:${HTTP_PORT}/mcp`);
  console.error(`[webdev] Health API on http://0.0.0.0:${HTTP_PORT}/api/health`);
});

process.on("SIGINT", async () => {
  for (const sid in transports) {
    await transports[sid].close();
    delete transports[sid];
  }
  pm.stopAll();
  await closeBrowser();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  for (const sid in transports) {
    await transports[sid].close();
    delete transports[sid];
  }
  pm.stopAll();
  await closeBrowser();
  process.exit(0);
});
