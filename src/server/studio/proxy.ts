import { Request, Response, Router } from "express";
import { request as httpRequest } from "http";
import type { ProjectManager } from "../project-manager.js";

export function createProxyRouter(pm: ProjectManager): Router {
  const router = Router();

  // Use a single param for project, then derive the rest from req.url
  router.use("/:project", (req: Request, res: Response) => {
    const project = String(req.params.project);
    const port = pm.getDevServerPort(project);

    if (!port) {
      res.status(502).send(`Project '${project}' has no running preview server.`);
      return;
    }

    // req.url is the part after /:project (e.g., /screens/dashboard)
    const targetPath = req.url || "/";

    const proxyReq = httpRequest(
      {
        hostname: "localhost",
        port,
        path: targetPath,
        method: req.method,
        headers: {
          ...req.headers,
          host: `localhost:${port}`,
          "accept-encoding": "identity",
        },
      },
      (proxyRes) => {
        const contentType = proxyRes.headers["content-type"] || "";
        const isHtml = contentType.includes("text/html");

        if (isHtml) {
          const chunks: Buffer[] = [];
          proxyRes.on("data", (chunk: Buffer) => chunks.push(chunk));
          proxyRes.on("end", () => {
            let html = Buffer.concat(chunks).toString("utf-8");
            // Rewrite root-relative asset paths to go through proxy
            const prefix = `/proxy/${project}`;
            html = html.replace(/"\/_next\//g, `"${prefix}/_next/`);
            html = html.replace(/'\/_next\//g, `'${prefix}/_next/`);

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
      }
    );

    proxyReq.on("error", (err) => {
      if (!res.headersSent) {
        res.status(502).send(`Proxy error: ${err.message}`);
      }
    });

    if (req.method !== "GET" && req.method !== "HEAD") {
      req.pipe(proxyReq);
    } else {
      proxyReq.end();
    }
  });

  return router;
}
