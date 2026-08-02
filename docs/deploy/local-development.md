---
title: Local Development
summary: Set up Bullpen for local development
---

Run Bullpen locally with zero external dependencies.

## Prerequisites

- Node.js 20+
- pnpm 9+

## Start Dev Server

```sh
pnpm install
pnpm dev
```

This starts:

- **API server** at `http://localhost:3100`
- **UI** served by the API server in dev middleware mode (same origin)

No Docker or external database required. Bullpen uses embedded PostgreSQL automatically.

## One-Command Bootstrap

For a first-time install:

```sh
pnpm bullpen run
```

This does:

1. Auto-onboards if config is missing
2. Runs `bullpen doctor` with repair enabled
3. Starts the server when checks pass

## Bind Presets In Dev

Default `pnpm dev` stays in `local_trusted` with loopback-only binding.

To open Bullpen to a private network with login enabled:

```sh
pnpm dev --bind lan
```

For Tailscale-only binding on a detected tailnet address:

```sh
pnpm dev --bind tailnet
```

Legacy aliases still work and map to the older broad private-network behavior:

```sh
pnpm dev --tailscale-auth
pnpm dev --authenticated-private
```

Allow additional private hostnames:

```sh
pnpm bullpen allowed-hostname dotta-macbook-pro
```

For full setup and troubleshooting, see [Tailscale Private Access](/deploy/tailscale-private-access).

## Health Checks

```sh
curl http://localhost:3100/api/health
# -> {"status":"ok"}

curl http://localhost:3100/api/companies
# -> []
```

## Safe Worktree Bootstrap for Local Agent Runs

For safer parallel local experiments, initialize a dedicated worktree instance instead of reusing your main checkout:

```sh
pnpm bullpen worktree:make local-lab --seed-mode minimal
cd ~/bullpen-local-lab
pnpm bullpen worktree env                       # inspect generated env exports
eval "$(pnpm bullpen worktree env)"             # bash/zsh
pnpm bullpen run
pnpm bullpen doctor
```

If the experiment gets noisy, repair or reseed the worktree without touching the main branch:

```sh
pnpm bullpen worktree repair --branch bullpen-local-lab
pnpm bullpen worktree reseed --from . --to bullpen-local-lab
```

When done, shut it down and remove the isolated state explicitly:

```sh
pnpm bullpen worktree:cleanup local-lab --force
```

## Reset Dev Data

To wipe local data and start fresh:

```sh
rm -rf ~/.bullpen/instances/default/db
pnpm dev
```

## Data Locations

| Data | Path |
|------|------|
| Config | `~/.bullpen/instances/default/config.json` |
| Database | `~/.bullpen/instances/default/db` |
| Storage | `~/.bullpen/instances/default/data/storage` |
| Secrets key | `~/.bullpen/instances/default/secrets/master.key` |
| Logs | `~/.bullpen/instances/default/logs` |

Override with environment variables:

```sh
BULLPEN_HOME=/custom/path BULLPEN_INSTANCE_ID=dev pnpm bullpen run
```
