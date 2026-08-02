---
title: CLI Overview
summary: CLI installation and setup
---

The Bullpen CLI handles instance setup, diagnostics, and control-plane operations.

## Usage

```sh
pnpm bullpen --help
```

## Global Options

All commands support:

| Flag | Description |
|------|-------------|
| `--data-dir <path>` | Local Bullpen data root (isolates from `~/.bullpen`) |
| `--api-base <url>` | API base URL |
| `--api-key <token>` | API authentication token |
| `--context <path>` | Context file path |
| `--profile <name>` | Context profile name |
| `--json` | Output as JSON |

Company-scoped commands also accept `--company-id <id>`.

For clean local instances, pass `--data-dir` on the command you run:

```sh
pnpm bullpen run --data-dir ./tmp/bullpen-dev
```

## Context Profiles

Store defaults to avoid repeating flags:

```sh
# Set defaults
pnpm bullpen context set --api-base http://localhost:3100 --company-id <id>

# View current context
pnpm bullpen context show

# List profiles
pnpm bullpen context list

# Switch profile
pnpm bullpen context use default
```

To avoid storing secrets in context, use an env var:

```sh
pnpm bullpen context set --api-key-env-var-name BULLPEN_API_KEY
export BULLPEN_API_KEY=...
```

Secret operations are available under `bullpen secrets`:

```sh
pnpm bullpen secrets declarations --company-id <company-id> --kind secret
pnpm bullpen secrets create --company-id <company-id> --name anthropic-api-key --value-env ANTHROPIC_API_KEY
pnpm bullpen secrets link --company-id <company-id> --name prod-stripe-key --provider aws_secrets_manager --external-ref <provider-ref>
pnpm bullpen secrets doctor --company-id <company-id>
pnpm bullpen secrets migrate-inline-env --company-id <company-id> --apply
```

Context is stored at `~/.bullpen/context.json`.

## Command Categories

The CLI has two categories:

1. **[Setup commands](/cli/setup-commands)** — instance bootstrap, diagnostics, configuration
2. **[Control-plane commands](/cli/control-plane-commands)** — issues, agents, approvals, activity
