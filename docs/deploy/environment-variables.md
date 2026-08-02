---
title: Environment Variables
summary: Full environment variable reference
---

All environment variables that Bullpen uses for server configuration.

## Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3100` | Server port |
| `BULLPEN_BIND` | `loopback` | Reachability preset: `loopback`, `lan`, `tailnet`, or `custom` |
| `BULLPEN_BIND_HOST` | (unset) | Required when `BULLPEN_BIND=custom` |
| `HOST` | `127.0.0.1` | Legacy host override; prefer `BULLPEN_BIND` for new setups |
| `DATABASE_URL` | (embedded) | PostgreSQL connection string |
| `BULLPEN_HOME` | `~/.bullpen` | Base directory for all Bullpen data |
| `BULLPEN_INSTANCE_ID` | `default` | Instance identifier (for multiple local instances) |
| `BULLPEN_DEPLOYMENT_MODE` | `local_trusted` | Runtime mode override |
| `BULLPEN_DEPLOYMENT_EXPOSURE` | `private` | Exposure policy when deployment mode is `authenticated` |
| `BULLPEN_API_URL` | (auto-derived) | Bullpen API base URL. When set externally (e.g., via Kubernetes ConfigMap, load balancer, or reverse proxy), the server preserves the value instead of deriving it from the listen host and port. Useful for deployments where the public-facing URL differs from the local bind address. |

## Secrets

| Variable | Default | Description |
|----------|---------|-------------|
| `BULLPEN_SECRETS_MASTER_KEY` | (from file) | 32-byte encryption key (base64/hex/raw) |
| `BULLPEN_SECRETS_MASTER_KEY_FILE` | `~/.bullpen/.../secrets/master.key` | Path to key file |
| `BULLPEN_SECRETS_STRICT_MODE` | `false` | Require secret refs for sensitive env vars |

## Agent Runtime (Injected into agent processes)

These are set automatically by the server when invoking agents:

| Variable | Description |
|----------|-------------|
| `BULLPEN_AGENT_ID` | Agent's unique ID |
| `BULLPEN_COMPANY_ID` | Company ID |
| `BULLPEN_API_URL` | Bullpen API base URL (inherits the server-level value; see Server Configuration above) |
| `BULLPEN_API_KEY` | Short-lived JWT for API auth |
| `BULLPEN_RUN_ID` | Current heartbeat run ID |
| `BULLPEN_TASK_ID` | Issue that triggered this wake |
| `BULLPEN_WAKE_REASON` | Wake trigger reason |
| `BULLPEN_WAKE_COMMENT_ID` | Comment that triggered this wake |
| `BULLPEN_APPROVAL_ID` | Resolved approval ID |
| `BULLPEN_APPROVAL_STATUS` | Approval decision |
| `BULLPEN_LINKED_ISSUE_IDS` | Comma-separated linked issue IDs |

## LLM Provider Keys (for adapters)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (for Claude Code adapter) |
| `OPENAI_API_KEY` | OpenAI API key (for Codex adapter) |
