import { Request, Response, Router } from "express";
import { createProxyServer } from "http-proxy";
import type { Server } from "http";
import type { ProjectManager } from "../project-manager.js";
import { getEditingRuntimeScript } from "./editing-runtime.js";

const editScript = getEditingRuntimeScript();

export function createProxyRouter(pm: ProjectManager): Router {
  const router = Router();

  router.use("/:project", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const port = pm.getDevServerPort(project);

    if (!port) {
      // Auto-start if not already starting
      if (!pm.isStarting(project) && pm.getProjectInfo(project)) {
        pm.startDevServer(project).catch(() => {});
      }
      res.status(503).type("html").send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Starting…</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#faf9f7;color:#555}
.wrap{text-align:center}.dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#F5C542;animation:p 1.2s ease-in-out infinite;margin-right:8px}
@keyframes p{0%,100%{opacity:1}50%{opacity:.3}}
</style></head><body><div class="wrap"><p><span class="dot"></span>Starting preview server…</p>
<script>setInterval(()=>fetch(location.href).then(r=>{if(r.ok)location.reload()}),2000)</script>
</div></body></html>`);
      return;
    }

    const injectEdit = req.query.edit === "1";

    // Use http-proxy for the request
    const proxy = createProxyServer({
      target: `http://localhost:${port}`,
      selfHandleResponse: true,
      ws: false, // WS handled separately via upgrade
    });

    proxy.on("proxyRes", (proxyRes, _req, _res) => {
      const contentType = proxyRes.headers["content-type"] || "";
      const isHtml = contentType.includes("text/html");

      if (isHtml) {
        const chunks: Buffer[] = [];
        proxyRes.on("data", (chunk: Buffer) => chunks.push(chunk));
        proxyRes.on("end", () => {
          let html = Buffer.concat(chunks).toString("utf-8");
          // Rewrite asset paths to go through proxy
          const prefix = `/proxy/${project}`;
          html = html.replace(/"\/_next\//g, `"${prefix}/_next/`);
          html = html.replace(/'\/_next\//g, `'${prefix}/_next/`);

          // Inject editing runtime if edit mode
          if (injectEdit) {
            html = html.replace("</body>", `<script>${editScript}</script></body>`);
          }

          const headers = { ...proxyRes.headers };
          delete headers["content-length"];
          delete headers["content-encoding"];
          headers["content-length"] = String(Buffer.byteLength(html));

          res.writeHead(proxyRes.statusCode ?? 200, headers);
          res.end(html);
        });
      } else {
        res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
        proxyRes.pipe(res);
      }
    });

    proxy.on("error", (err) => {
      if (!res.headersSent) {
        res.status(502).send(`Proxy error: ${err.message}`);
      }
    });

    proxy.web(req, res);
  });

  return router;
}

/**
 * Set up WebSocket proxy for HMR. Call this after the HTTP server is created.
 * Handles upgrade requests on /proxy/:project/_next/webpack-hmr
 */
export function setupWebSocketProxy(server: Server, pm: ProjectManager): void {
  server.on("upgrade", (req, socket, head) => {
    const url = req.url || "";
    const match = url.match(/^\/proxy\/([^/]+)\//);
    if (!match) return;

    const project = match[1];
    const port = pm.getDevServerPort(project);
    if (!port) {
      socket.destroy();
      return;
    }

    const proxy = createProxyServer({ target: `http://localhost:${port}`, ws: true });
    // Rewrite the URL to remove the /proxy/:project prefix
    req.url = url.replace(`/proxy/${project}`, "");
    proxy.ws(req, socket, head);
    proxy.on("error", () => socket.destroy());
  });
}
