import { execSync, spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";
import { createServer } from "net";
import type { ProjectWorkspaceService } from "./workspace.js";

const execAsync = promisify(exec);

const PORT_RANGE_START = 4501;
const PORT_RANGE_END = 4510;
const READINESS_TIMEOUT_MS = 30000;
const READINESS_POLL_MS = 500;
const MAX_LOG_LINES = 200;

interface DevServer {
  process: ChildProcess;
  port: number;
  stdout: string[];
  stderr: string[];
}

/**
 * Manages dev server lifecycle: build, start, stop, restart, readiness checks.
 */
export class PreviewRuntimeService {
  private devServers = new Map<string, DevServer>();
  private starting = new Set<string>();

  constructor(private workspace: ProjectWorkspaceService) {}

  /** True if a server is currently being built/started (but not yet ready). */
  isStarting(projectName: string): boolean {
    return this.starting.has(projectName);
  }

  async startDevServer(projectName: string): Promise<number> {
    const existing = this.devServers.get(projectName);
    if (existing) return existing.port;
    if (this.starting.has(projectName)) return -1; // already starting

    this.starting.add(projectName);

    const port = await this.findOpenPort();
    const dir = this.workspace.projectDir(projectName);

    // Build first for production-mode serving (deterministic screenshots)
    await execAsync("npm run build", { cwd: dir, timeout: 120000 });

    const srv = this.spawnServer(dir, port);
    this.devServers.set(projectName, srv);

    const ready = await this.waitForReady(port);
    this.starting.delete(projectName);
    if (!ready) {
      this.killProcess(srv.process);
      this.devServers.delete(projectName);
      const logs = srv.stderr.slice(-20).join("\n");
      throw new Error(
        `Preview server for '${projectName}' failed to become ready on port ${port} within ${READINESS_TIMEOUT_MS / 1000}s.\nRecent stderr:\n${logs}`
      );
    }

    return port;
  }

  async rebuildAndRestart(projectName: string): Promise<void> {
    const srv = this.devServers.get(projectName);
    if (!srv) return;
    const dir = this.workspace.projectDir(projectName);
    const port = srv.port;

    this.killProcess(srv.process);
    this.devServers.delete(projectName);

    await execAsync("npm run build", { cwd: dir, timeout: 120000 });

    const newSrv = this.spawnServer(dir, port);
    this.devServers.set(projectName, newSrv);

    const ready = await this.waitForReady(port);
    if (!ready) {
      this.killProcess(newSrv.process);
      this.devServers.delete(projectName);
      const logs = newSrv.stderr.slice(-20).join("\n");
      throw new Error(
        `Preview server for '${projectName}' failed to restart on port ${port} within ${READINESS_TIMEOUT_MS / 1000}s.\nRecent stderr:\n${logs}`
      );
    }
  }

  stopDevServer(projectName: string): void {
    const srv = this.devServers.get(projectName);
    if (srv) {
      this.killProcess(srv.process);
      this.devServers.delete(projectName);
    }
  }

  getDevServerPort(projectName: string): number | null {
    return this.devServers.get(projectName)?.port ?? null;
  }

  /** Get recent stdout/stderr logs for a project's preview server. */
  getServerLogs(projectName: string): { stdout: string[]; stderr: string[] } | null {
    const srv = this.devServers.get(projectName);
    if (!srv) return null;
    return { stdout: [...srv.stdout], stderr: [...srv.stderr] };
  }

  stopAll(): void {
    for (const [name] of this.devServers) {
      this.stopDevServer(name);
    }
  }

  /** Find an open port within the allowed range that isn't already claimed. */
  private async findOpenPort(): Promise<number> {
    const usedPorts = new Set([...this.devServers.values()].map((s) => s.port));

    for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
      if (usedPorts.has(port)) continue;
      const available = await this.isPortAvailable(port);
      if (available) return port;
    }

    throw new Error(
      `No available ports in range ${PORT_RANGE_START}-${PORT_RANGE_END}. ` +
      `${this.devServers.size} servers running. Stop a project to free a port.`
    );
  }

  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const srv = createServer();
      srv.once("error", () => resolve(false));
      srv.listen(port, "0.0.0.0", () => {
        srv.close(() => resolve(true));
      });
    });
  }

  private spawnServer(dir: string, port: number): DevServer {
    const proc = spawn("npx", ["next", "start", "--port", String(port)], {
      cwd: dir, stdio: "pipe", shell: true,
    });

    const stdout: string[] = [];
    const stderr: string[] = [];

    proc.stdout?.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        stdout.push(line);
        if (stdout.length > MAX_LOG_LINES) stdout.shift();
      }
    });

    proc.stderr?.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        stderr.push(line);
        if (stderr.length > MAX_LOG_LINES) stderr.shift();
      }
    });

    return { process: proc, port, stdout, stderr };
  }

  private async waitForReady(port: number): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < READINESS_TIMEOUT_MS) {
      try {
        const res = await fetch(`http://localhost:${port}`);
        if (res.ok) return true;
      } catch {}
      await new Promise((r) => setTimeout(r, READINESS_POLL_MS));
    }
    return false;
  }

  private killProcess(proc: ChildProcess): void {
    const pid = proc.pid;
    if (!pid) return;
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /f /t /pid ${pid}`, { stdio: "pipe" });
      } else {
        process.kill(-pid, "SIGTERM");
      }
    } catch {}
  }
}
