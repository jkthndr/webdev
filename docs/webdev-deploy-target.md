# webdev Deploy Target

Date: 2026-05-04
Status: Canonical for V1

## Canonical Runtime

webdev runs on the Dell laptop.

- Host: Dell laptop
- Tailscale IP: `100.115.18.15`
- Local repo path: `C:\Users\olive\Projects\webdev`
- Studio/API/MCP base: `http://100.115.18.15:4500`
- Health check: `http://100.115.18.15:4500/api/health`
- Local-on-host health check: `http://localhost:4500/api/health`
- Agent bridge: `http://100.115.18.15:3100`

Playbook is separate and still runs on the HP laptop:

- Playbook: `http://100.102.138.90:3095`
- Playbook API: `http://100.102.138.90:3095/api`

Do not use the HP laptop IP as the webdev runtime target unless this file is updated in the same change.

## Verification

Checked from `C:\Users\olive\Projects\webdev` on 2026-05-04:

- `http://100.115.18.15:4500/api/health` returned `{"status":"ok","projects":0,"screens":0,"version":"0.1.0"}`.
- `http://localhost:4500/api/health` returned `{"status":"ok","projects":0,"screens":0,"version":"0.1.0"}`.
- `http://100.102.138.90:4500/api/health` timed out and is not the current webdev runtime.

## Port Model

- `4500` is the only external URL agents and users should need.
- Live Studio preview should load generated Next routes through webdev's proxy on port `4500`.
- Preview app ports are internal runtime implementation details and should not be documented as the human review URL.
