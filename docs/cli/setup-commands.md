---
title: Setup Commands
summary: Onboard, run, doctor, and configure
---

Instance setup and diagnostics commands.

## `bullpen run`

One-command bootstrap and start:

```sh
pnpm bullpen run
```

Does:

1. Auto-onboards if config is missing
2. Runs `bullpen doctor` with repair enabled
3. Starts the server when checks pass

Choose a specific instance:

```sh
pnpm bullpen run --instance dev
```

## `bullpen onboard`

Interactive first-time setup:

```sh
pnpm bullpen onboard
```

If Bullpen is already configured, rerunning `onboard` keeps the existing config in place. Use `bullpen configure` to change settings on an existing install.

First prompt:

1. `Quickstart` (recommended): local defaults (embedded database, no LLM provider, local disk storage, default secrets)
2. `Advanced setup`: full interactive configuration

Start immediately after onboarding:

```sh
pnpm bullpen onboard --run
```

Non-interactive defaults + immediate start (opens browser on server listen):

```sh
pnpm bullpen onboard --yes
```

On an existing install, `--yes` now preserves the current config and just starts Bullpen with that setup.

## `bullpen doctor`

Health checks with optional auto-repair:

```sh
pnpm bullpen doctor
pnpm bullpen doctor --repair
```

Validates:

- Server configuration
- Database connectivity
- Secrets adapter configuration, including AWS Secrets Manager non-secret env
  config when selected
- Storage configuration
- Missing key files

## `bullpen configure`

Update configuration sections:

```sh
pnpm bullpen configure --section server
pnpm bullpen configure --section secrets
pnpm bullpen configure --section storage
```

`--section secrets` updates the deployment-level provider used as the fallback
for secrets that do not target a specific company vault. Per-company provider
vaults (named instances, default vault selection, multiple vaults per provider,
coming-soon GCP/Vault) live in the board UI under
`Company Settings → Secrets → Provider vaults` and the
`/api/companies/{companyId}/secret-provider-configs` API.

## `bullpen env`

Show resolved environment configuration:

```sh
pnpm bullpen env
```

This now includes bind-oriented deployment settings such as `BULLPEN_BIND` and `BULLPEN_BIND_HOST` when configured.

## `bullpen allowed-hostname`

Allow a private hostname for authenticated/private mode:

```sh
pnpm bullpen allowed-hostname my-tailscale-host
```

## Local Storage Paths

| Data | Default Path |
|------|-------------|
| Config | `~/.bullpen/instances/default/config.json` |
| Database | `~/.bullpen/instances/default/db` |
| Logs | `~/.bullpen/instances/default/logs` |
| Storage | `~/.bullpen/instances/default/data/storage` |
| Secrets key | `~/.bullpen/instances/default/secrets/master.key` |

Override with:

```sh
BULLPEN_HOME=/custom/home BULLPEN_INSTANCE_ID=dev pnpm bullpen run
```

Or pass `--data-dir` directly on any command:

```sh
pnpm bullpen run --data-dir ./tmp/bullpen-dev
pnpm bullpen doctor --data-dir ./tmp/bullpen-dev
```
