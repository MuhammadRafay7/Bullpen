# CLI Reference

Bullpen CLI now supports both:

- installation and lifecycle management (`install`, `uninstall`, `update`, `upgrade`, `service`)
- instance setup/diagnostics (`onboard`, `doctor`, `configure`, `env`, `allowed-hostname`, `env-lab`)
- control-plane client operations (issues, approvals, agents, activity, dashboard)

## Base Usage

Use repo script in development:

```sh
pnpm bullpen --help
```

Recommended installation and interactive onboarding:

```sh
curl -fsSLO https://paperclip.ing/install.sh
curl -fsSLO https://paperclip.ing/install.sh.sha256
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum -c install.sh.sha256
else
  shasum -a 256 -c install.sh.sha256
fi
bash install.sh
```

The checksum detects transfer or publishing mistakes but is served from the
same origin as the installer. Use a release-tag or commit-pinned GitHub copy
when you need an independently hosted source. Piped installs require supported
Node.js, npm, and npx to already be installed; download the script first before
allowing it to bootstrap Node.js with privileged package-manager commands.

First-time local bootstrap from a source checkout:

```sh
pnpm bullpen run
```

Choose local instance:

```sh
pnpm bullpen run --instance dev
```

## Install, Update, And Uninstall

Managed installs keep CLI payloads under `~/.bullpen/cli`, expose a stable
`~/.local/bin/bullpen` shim, switch versions atomically, and retain two
previous payloads for rollback.

```sh
bullpen install
bullpen install --canary
bullpen install --version <version>
bullpen install --ref <branch|tag|sha> [--repo owner/repo]
bullpen update
bullpen update --latest|--canary|--version <version>
bullpen update --rollback
bullpen upgrade
bullpen uninstall
```

`upgrade` aliases `update`. `uninstall` removes managed code and the shim but
preserves instance data under `~/.bullpen/instances/`. See
`doc/INSTALLING.md` for installation methods, security notes, PATH setup, and
the complete update and rollback behavior.

## Onboarding And Service Management

Interactive onboarding offers to install a background service on supported
platforms. `--yes` never installs it implicitly; automation must opt in.

```sh
bullpen onboard
bullpen onboard --yes
bullpen onboard --yes --install-service
bullpen onboard --yes --no-install-service
```

Service lifecycle commands remain under the `service` namespace:

```sh
bullpen service install [--no-start-now] [--no-start-on-login]
bullpen service uninstall
bullpen service start
bullpen service stop
bullpen service restart [--wait]
bullpen service status [--json]
bullpen service logs [-f]
```

Every service verb supports `--instance <id>` and `--json`. Linux and WSL2 use
a systemd user unit when available; macOS uses a LaunchAgent. Unsupported
environments receive foreground `bullpen run` guidance.

`bullpen doctor` includes managed-install and service-health diagnostics in
addition to configuration, storage, database, logging, and port checks.

## Deployment Modes

Mode taxonomy and design intent are documented in `doc/DEPLOYMENT-MODES.md`.

Current CLI behavior:

- `bullpen onboard` and `bullpen configure --section server` set deployment mode in config
- server onboarding/configure ask for reachability intent and write `server.bind`
- `bullpen run --bind <loopback|lan|tailnet>` passes a quickstart bind preset into first-run onboarding when config is missing
- runtime can override mode with `BULLPEN_DEPLOYMENT_MODE`
- `bullpen run` and `bullpen doctor` still do not expose a direct low-level `--mode` flag

Canonical behavior is documented in `doc/DEPLOYMENT-MODES.md`.

Allow an authenticated/private hostname (for example custom Tailscale DNS):

```sh
pnpm bullpen allowed-hostname dotta-macbook-pro
```

Bring up the default local SSH fixture for environment testing:

```sh
pnpm bullpen env-lab up
pnpm bullpen env-lab doctor
pnpm bullpen env-lab status --json
pnpm bullpen env-lab down
```

All client commands support:

- `--data-dir <path>`
- `--api-base <url>`
- `--api-key <token>`
- `--context <path>`
- `--profile <name>`
- `--json`

Company-scoped commands also support `--company-id <id>`.

API base resolution order:

1. `--api-base <url>`
2. `BULLPEN_API_URL`
3. selected context profile `apiBase`
4. local Bullpen config server port
5. `http://localhost:3100`

Connection failures include the attempted URL and a `GET /api/health` check hint.

## Connect Wizard

```sh
pnpm bullpen connect
```

`connect` confirms the resolved API base, verifies `GET /api/health`, authenticates board access when needed, and saves a persona-aware profile:

- `persona=board` for board operator profiles
- `persona=agent` with `agentId` and `agentName` for agent profiles

Profiles store token env-var names, not plaintext tokens. The wizard prints shell exports for the newly created token.

Use `--data-dir` on any CLI command to isolate all default local state (config/context/db/logs/storage/secrets) away from `~/.bullpen`:

```sh
pnpm bullpen run --data-dir ./tmp/bullpen-dev
pnpm bullpen issue list --data-dir ./tmp/bullpen-dev
```

## Context Profiles

Store local defaults in `~/.bullpen/context.json`:

```sh
pnpm bullpen context set --api-base http://localhost:3100 --company-id <company-id>
pnpm bullpen context set --persona agent --agent-id <agent-id> --api-key-env-var-name BULLPEN_API_KEY
pnpm bullpen context show
pnpm bullpen context list
pnpm bullpen context use default
```

To avoid storing secrets in context, set `apiKeyEnvVarName` and keep the key in env:

```sh
pnpm bullpen context set --api-key-env-var-name BULLPEN_API_KEY
export BULLPEN_API_KEY=...
```

## Company Commands

```sh
pnpm bullpen company list
pnpm bullpen company get <company-id>
pnpm bullpen company current [--company-id <company-id>]
pnpm bullpen company stats
pnpm bullpen company create --payload-json '{...}'
pnpm bullpen company update <company-id> --payload-json '{...}'
pnpm bullpen company branding:update <company-id> --payload-json '{...}'
pnpm bullpen company archive <company-id>
pnpm bullpen company export <company-id> --out ./company --include company,agents,projects,issues,skills
pnpm bullpen company export:preview <company-id> --payload-json '{...}'
pnpm bullpen company export:api <company-id> --payload-json '{...}'
pnpm bullpen company import ./company --target new --new-company-name "Imported Company"
pnpm bullpen company import:preview <company-id> --payload-json '{...}'
pnpm bullpen company import:apply <company-id> --payload-json '{...}'
pnpm bullpen company delete <company-id-or-prefix> --yes --confirm <same-id-or-prefix>
```

Examples:

```sh
pnpm bullpen company delete PAP --yes --confirm PAP
pnpm bullpen company delete 5cbe79ee-acb3-4597-896e-7662742593cd --yes --confirm 5cbe79ee-acb3-4597-896e-7662742593cd
```

Notes:

- With agent authentication, `company list` and `company current` are
  agent-safe company selectors. `company list` first tries the board-wide list;
  if that is forbidden, it uses `--company-id`, `BULLPEN_COMPANY_ID`, context,
  or `/api/agents/me` and then reads only that scoped company.
- `company create` requires board/instance-admin authentication because it is
  an instance-wide setup command.
- Deletion is server-gated by `BULLPEN_ENABLE_COMPANY_DELETION`.
- With agent authentication, company deletion is company-scoped. Use the current company ID/prefix (for example via `--company-id` or `BULLPEN_COMPANY_ID`), not another company.

## Issue Commands

```sh
pnpm bullpen issue list --company-id <company-id> [--status todo,in_progress] [--assignee-agent-id <agent-id>] [--match text]
pnpm bullpen issue get <issue-id-or-identifier>
pnpm bullpen issue create --company-id <company-id> --title "..." [--description "..."] [--status todo] [--priority high]
pnpm bullpen issue update <issue-id> [--status in_progress] [--comment "..."]
pnpm bullpen issue delete <issue-id> --yes
pnpm bullpen issue comment <issue-id> --body "..." [--reopen]
pnpm bullpen issue comments <issue-id> [--limit 50]
pnpm bullpen issue comment:get <issue-id> <comment-id>
pnpm bullpen issue comment:delete <issue-id> <comment-id>
pnpm bullpen issue runs <issue-id-or-identifier>
pnpm bullpen issue live-runs <issue-id-or-identifier>
pnpm bullpen issue active-run <issue-id-or-identifier>
pnpm bullpen issue heartbeat-context <issue-id>
pnpm bullpen issue checkout <issue-id> --agent-id <agent-id> [--expected-statuses todo,backlog,blocked]
pnpm bullpen issue release <issue-id>
pnpm bullpen issue force-release <issue-id>
```

Issue subresources are exposed as Bullpen API wrappers. Commands that map to broad server schemas accept JSON payloads and validate them with shared schemas before sending.

```sh
pnpm bullpen issue child:create <issue-id> --payload-json '{"title":"Child task"}'
pnpm bullpen issue approvals <issue-id>
pnpm bullpen issue approval:link <issue-id> <approval-id>
pnpm bullpen issue approval:unlink <issue-id> <approval-id>
pnpm bullpen issue read <issue-id>
pnpm bullpen issue unread <issue-id>
pnpm bullpen issue archive <issue-id>
pnpm bullpen issue unarchive <issue-id>
pnpm bullpen issue recovery-actions <issue-id>
pnpm bullpen issue recovery:resolve <issue-id> --outcome restored --source-issue-status todo
```

```sh
pnpm bullpen issue documents <issue-id> [--include-system]
pnpm bullpen issue document:get <issue-id> <key>
pnpm bullpen issue document:put <issue-id> <key> --body-file ./plan.md [--title Plan]
pnpm bullpen issue document:lock <issue-id> <key>
pnpm bullpen issue document:unlock <issue-id> <key>
pnpm bullpen issue document:revisions <issue-id> <key>
pnpm bullpen issue document:restore <issue-id> <key> <revision-id>
pnpm bullpen issue document:delete <issue-id> <key>
```

```sh
pnpm bullpen issue work-products <issue-id>
pnpm bullpen issue work-product:create <issue-id> --payload-json '{"type":"pull_request","provider":"github","title":"PR"}'
pnpm bullpen issue work-product:update <work-product-id> --payload-json '{"status":"archived"}'
pnpm bullpen issue work-product:delete <work-product-id>
pnpm bullpen issue interactions <issue-id>
pnpm bullpen issue interaction:create <issue-id> --payload-json '{"kind":"request_confirmation","payload":{"version":1,"prompt":"Continue?"}}'
pnpm bullpen issue interaction:accept <issue-id> <interaction-id> [--selected-client-keys key1,key2]
pnpm bullpen issue interaction:reject <issue-id> <interaction-id> [--reason "..."]
pnpm bullpen issue interaction:respond <issue-id> <interaction-id> --answers-json '[{"questionId":"q1","optionIds":["yes"]}]'
pnpm bullpen issue interaction:cancel <issue-id> <interaction-id> [--reason "..."]
```

```sh
pnpm bullpen issue tree-state <issue-id>
pnpm bullpen issue tree-preview <issue-id> --payload-json '{"mode":"pause"}'
pnpm bullpen issue tree-holds <issue-id> [--status active] [--include-members]
pnpm bullpen issue tree-hold:create <issue-id> --payload-json '{"mode":"pause","reason":"review"}'
pnpm bullpen issue tree-hold:get <issue-id> <hold-id>
pnpm bullpen issue tree-hold:release <issue-id> <hold-id> [--payload-json '{"reason":"done"}']
pnpm bullpen issue attachments <issue-id>
pnpm bullpen issue attachment:upload <issue-id> --company-id <company-id> --file ./artifact.txt
pnpm bullpen issue attachment:download <attachment-id> [--out ./artifact.txt]
pnpm bullpen issue attachment:delete <attachment-id>
pnpm bullpen issue label:list --company-id <company-id>
pnpm bullpen issue label:create --company-id <company-id> --name bug --color '#ff0000'
pnpm bullpen issue label:delete <label-id>
pnpm bullpen issue feedback:votes <issue-id>
pnpm bullpen issue feedback:vote <issue-id> --payload-json '{"targetType":"issue_comment","targetId":"...","vote":"up"}'
```

## Project Commands

```sh
pnpm bullpen project list --company-id <company-id>
pnpm bullpen project get <project-id-or-shortname> [--company-id <company-id>]
pnpm bullpen project create --company-id <company-id> --name "Launch Site" [--goal-ids <id1,id2>] [--lead-agent-id <id>]
pnpm bullpen project update <project-id-or-shortname> [--status in_progress] [--company-id <company-id>]
pnpm bullpen project delete <project-id-or-shortname> --yes [--company-id <company-id>]
```

Advanced project fields accept JSON:

```sh
pnpm bullpen project create --company-id <company-id> --name "Ops" --env-json '{"OPENAI_API_KEY":{"kind":"secret","secretName":"openai-api-key"}}'
pnpm bullpen project update <project-id> --execution-workspace-policy-json '{"enabled":true,"defaultMode":"shared_workspace"}'
```

## Goal Commands

```sh
pnpm bullpen goal list --company-id <company-id>
pnpm bullpen goal get <goal-id>
pnpm bullpen goal create --company-id <company-id> --title "Grow revenue" [--level company] [--status active]
pnpm bullpen goal update <goal-id> [--title "..."] [--status achieved]
pnpm bullpen goal delete <goal-id> --yes
```

## Agent Commands

```sh
pnpm bullpen agent list --company-id <company-id>
pnpm bullpen agent get <agent-id>
pnpm bullpen agent create --company-id <company-id> --payload-json '{"name":"Builder","adapterType":"codex_local"}'
pnpm bullpen agent hire --company-id <company-id> --payload-json '{...}'
pnpm bullpen agent update <agent-id> --payload-json '{"title":"Senior Builder"}'
pnpm bullpen agent delete <agent-id> --yes
pnpm bullpen agent me
pnpm bullpen agent inbox
pnpm bullpen agent inbox-mine --user-id <board-user-id>
pnpm bullpen agent wake <agent-id-or-shortname> [--company-id <company-id>] [--reason "..."] [--payload '{"issueId":"..."}']
pnpm bullpen agent pause <agent-id>
pnpm bullpen agent resume <agent-id>
pnpm bullpen agent approve <agent-id>
pnpm bullpen agent terminate <agent-id>
pnpm bullpen agent heartbeat:invoke <agent-id>
pnpm bullpen agent claude-login <agent-id>
pnpm bullpen agent local-cli <agent-id-or-shortname> --company-id <company-id>
```

Agent configuration and runtime endpoints:

```sh
pnpm bullpen agent permissions:update <agent-id> --payload-json '{"canCreateAgents":true,"canCreateSkills":true,"canAssignTasks":true}'
pnpm bullpen agent configuration <agent-id>
pnpm bullpen agent config-revisions <agent-id>
pnpm bullpen agent config-revision:get <agent-id> <revision-id>
pnpm bullpen agent config-revision:rollback <agent-id> <revision-id>
pnpm bullpen agent runtime-state <agent-id>
pnpm bullpen agent runtime-state:reset-session <agent-id> [--task-key <key>]
pnpm bullpen agent task-sessions <agent-id>
pnpm bullpen agent skills <agent-id>
pnpm bullpen agent skills:sync <agent-id> --desired-skills bullpen,github
pnpm bullpen agent instructions-path:update <agent-id> --payload-json '{"path":"/path/to/AGENTS.md"}'
pnpm bullpen agent instructions-bundle <agent-id>
pnpm bullpen agent instructions-bundle:update <agent-id> --payload-json '{"mode":"managed"}'
pnpm bullpen agent instructions-file:get <agent-id> --path AGENTS.md
pnpm bullpen agent instructions-file:put <agent-id> --path AGENTS.md --content-file ./AGENTS.md
pnpm bullpen agent instructions-file:delete <agent-id> --path AGENTS.md
```

Agent config, instructions, skills, project env, environment, secret, and workspace edits affect the next run. Active runs finish with the config they started with. When a saved session, reused workspace, or sandbox lease no longer matches the effective next-run config, Bullpen may start fresh execution and records non-sensitive freshness categories in run result JSON and workspace operation logs.

`agent local-cli` is the quickest way to run local Claude/Codex manually as a Bullpen agent:

- creates a new long-lived agent API key
- installs missing Bullpen skills into `~/.codex/skills` and `~/.claude/skills`
- prints `export ...` lines for `BULLPEN_API_URL`, `BULLPEN_COMPANY_ID`, `BULLPEN_AGENT_ID`, and `BULLPEN_API_KEY`

Example for shortname-based local setup:

```sh
pnpm bullpen agent local-cli codexcoder --company-id <company-id>
pnpm bullpen agent local-cli claudecoder --company-id <company-id>
```

## Token Commands

Agent API keys are scoped to one company and one agent. Plaintext tokens are printed once at creation.

```sh
pnpm bullpen token agent create --company-id <company-id> --agent <agent-id-or-name> --name external-worker
pnpm bullpen token agent list --company-id <company-id> --agent <agent-id-or-name>
pnpm bullpen token agent revoke --company-id <company-id> --agent <agent-id-or-name> <key-id>
```

Named board API keys use the board authorization model, support revocation and expiration metadata, and are audited server-side.

```sh
pnpm bullpen token board create --company-id <company-id> --name external-admin
pnpm bullpen token board create --name short-lived --ttl-days 7
pnpm bullpen token board list
pnpm bullpen token board revoke <key-id>
```

## Run Commands

`bullpen run` without a subcommand still bootstraps and starts a local Bullpen instance. The subcommands below inspect and control API heartbeat runs.

```sh
pnpm bullpen run list --company-id <company-id> [--agent-id <agent-id>] [--limit 50]
pnpm bullpen run live --company-id <company-id> [--limit 50] [--min-count 0]
pnpm bullpen run get <run-id>
pnpm bullpen run events <run-id> [--after-seq 0] [--limit 200]
pnpm bullpen run log <run-id> [--offset 0] [--limit-bytes 16384] [--text]
pnpm bullpen run cancel <run-id>
pnpm bullpen run issues <run-id>
pnpm bullpen run workspace-operations <run-id>
pnpm bullpen run workspace-log <operation-id> [--offset 0] [--limit-bytes 16384] [--text]
pnpm bullpen run watchdog-decision <run-id> --decision continue [--reason "..."]
```

## Routine Commands

`bullpen routines disable-all` remains the local maintenance command. The singular `routine` group maps to the REST API.

```sh
pnpm bullpen routine list --company-id <company-id> [--project-id <project-id>]
pnpm bullpen routine create --company-id <company-id> --payload-json '{...}'
pnpm bullpen routine get <routine-id>
pnpm bullpen routine update <routine-id> --payload-json '{...}'
pnpm bullpen routine revisions <routine-id>
pnpm bullpen routine revision:restore <routine-id> <revision-id>
pnpm bullpen routine runs <routine-id> [--limit 50]
pnpm bullpen routine run <routine-id> [--payload-json '{...}']
pnpm bullpen routine trigger:create <routine-id> --payload-json '{...}'
pnpm bullpen routine trigger:update <trigger-id> --payload-json '{...}'
pnpm bullpen routine trigger:delete <trigger-id>
pnpm bullpen routine trigger:rotate-secret <trigger-id>
pnpm bullpen routine trigger:fire <public-id> [--payload-json '{...}']
```

## Prompt Handoff

Prompt handoff creates Bullpen work. It does not create a chat session.

```sh
pnpm bullpen agent-prompt <agent-name-or-id> <agent-api-key> "Prompt here"
pnpm bullpen agent prompt --agent <agent-name-or-id> --api-key-env BULLPEN_API_KEY "Prompt here"
pnpm bullpen agent prompt --profile my-agent "Prompt here"
pnpm bullpen board prompt --company-id <company-id> --agent <agent-name-or-id> "Prompt here"
```

By default the command creates a `todo` issue assigned to the target agent and wakes the agent. Use `--issue <issue-id>` to add a comment to existing work, and `--no-wake` to skip the wakeup.

## Skills Commands

`bullpen skills` covers three distinct operations:

1. **Company install** — adds or updates a row in `company_skills` for the
   whole company. This is what `skills install`, `skills import`, `skills create`,
   and `skills scan-projects` do.
2. **Agent attach** — replaces an agent's *desired* company skill set
   (`skills agent sync`/`clear`). This is a desired-state operation on the
   agent's adapter config; it does not change the company library.
3. **Adapter runtime sync** — the adapter reconciles the desired skill set
   with files on disk and reports an `AgentSkillSnapshot` (`skills agent list`).
   `skills agent sync` triggers this automatically after updating desired state.

Required Bullpen runtime skills (heartbeat, etc.) remain server-enforced and
are added on top of whatever the desired set names.

Company skill mutations (`skills install`, `skills import`, `skills create`, and
`skills scan-projects`) are open to same-company actors by default. Missing
`skills:create` grants and `canCreateSkills` settings do not deny these commands;
only an explicit company skill policy restriction does. Core safety and company
boundary checks still apply, and `agents:create` remains required when a command
also creates agents.

### Catalog (app-shipped skills)

The Bullpen app ships a curated catalog under `@bullpen/skills-catalog`.
Browse and inspect commands never mutate company state; `install` adds a catalog
skill to the company library.

```sh
pnpm bullpen skills browse [--kind bundled|optional] [--category <slug>] [--query <text>]
pnpm bullpen skills search "<text>" [--kind bundled|optional] [--category <slug>]
pnpm bullpen skills inspect <catalog-id-or-key-or-slug>
pnpm bullpen skills install <catalog-id-or-key-or-slug> [--as <slug>] [--force] --company-id <company-id>
```

Catalog semantics:

- **Bundled** skills live in `packages/skills-catalog/catalog/bundled/<category>/<slug>`
  and are recommended defaults for most companies. They use canonical key
  `bullpen/bundled/<category>/<slug>`.
- **Optional** skills live in `packages/skills-catalog/catalog/optional/<category>/<slug>`
  and are role-specific or domain-specific (browser, AWS ops, etc.). Same key
  shape with `optional` in place of `bundled`.
- `skills install` materializes the catalog files into a company-managed skill
  directory and records provenance (`catalogId`, `catalogKey`, `packageVersion`,
  `originHash`, …) so future updates and audit decisions stay consistent.
- `--as <slug>` overrides the company skill slug. `--force` may replace a
  same-key catalog-managed skill but never bypasses hard validation or hard-stop
  audit findings.

Examples:

```sh
pnpm bullpen skills browse --kind bundled --company-id <company-id>
pnpm bullpen skills search "pull request" --kind bundled
pnpm bullpen skills inspect github-pr-workflow
pnpm bullpen skills install github-pr-workflow --company-id <company-id>
pnpm bullpen skills install bullpen:optional:browser:agent-browser --company-id <company-id>
```

External GitHub, skills.sh, local-path, and URL sources still go through
`skills import`; catalog commands are for the app-shipped catalog only.

### Company library

```sh
pnpm bullpen skills list --company-id <company-id>
pnpm bullpen skills show <skill-id-or-key-or-slug> --company-id <company-id>
pnpm bullpen skills file <skill-id-or-key-or-slug> [--path SKILL.md] --company-id <company-id>
pnpm bullpen skills import <source> --company-id <company-id>
pnpm bullpen skills create --name "Review PRs" [--slug review-prs] [--description "..."] [--body-file SKILL.md] --company-id <company-id>
pnpm bullpen skills scan-projects [--project-id <id>...] [--workspace-id <id>...] --company-id <company-id>
pnpm bullpen skills check [skill-id-or-key-or-slug] --company-id <company-id>
pnpm bullpen skills update <skill-id-or-key-or-slug> [--force] --company-id <company-id>
pnpm bullpen skills update --all [--force] --company-id <company-id>
pnpm bullpen skills audit [skill-id-or-key-or-slug] --company-id <company-id>
pnpm bullpen skills reset <skill-id-or-key-or-slug> [--yes] [--force] --company-id <company-id>
pnpm bullpen skills remove <skill-id-or-key-or-slug> --yes --company-id <company-id>
```

`skills import <source>` accepts a skills.sh URL, the equivalent
`<owner>/<repo>/<skill>` shorthand, a GitHub URL, a local path, or an
`npx skills add …` command. See `references/company-skills.md` in the agent
skill bundle for the source-type table.

`skills check`, `skills update`, `skills audit`, and `skills reset` are the
maintenance loop for catalog-installed skills:

- `check` reports whether each skill's installed bytes match its pinned origin
  (`hasUpdate`, `installedHash`, `originHash`, `updateHoldReason`,
  `auditVerdict`).
- `update` installs the pinned update through the existing install-update API.
  `--all` checks every company skill and updates only those with
  `hasUpdate=true`. `--force` discards local-modification or soft-audit holds;
  hard-stop audit findings still block the update.
- `audit` re-scans installed bytes and reports findings without executing
  anything.
- `reset` reinstalls a catalog-managed skill from its pinned origin, discarding
  local edits. Prompts in a TTY; requires `--yes` for non-interactive use.

### Agent attach

```sh
pnpm bullpen skills agent list <agent-id-or-shortname> --company-id <company-id>
pnpm bullpen skills agent sync <agent-id-or-shortname> --skill <skill-id-or-key-or-slug> [--skill <skill-id-or-key-or-slug>...] --company-id <company-id>
pnpm bullpen skills agent clear <agent-id-or-shortname> --yes --company-id <company-id>
```

`skills agent sync` replaces the agent's non-required desired skill set (it is
not additive) and returns the resulting adapter `AgentSkillSnapshot`.
`skills agent clear` sends an empty desired list. Required Bullpen skills are
still enforced by the server in both cases.

### Notes

- Skill references accept company skill `id`, canonical `key`, or unique
  `slug`; catalog references accept catalog `id`, `key`, or unique `slug`.
- `skills file` prints raw file content in human mode so it can be piped.
- `skills create --body-file -` reads the skill markdown body from stdin.
- `skills remove`, `skills reset`, and `skills agent clear` prompt in a TTY and
  require `--yes` in non-interactive use.
- `--json` prints the raw API result for each command.

## Teams Commands

`bullpen teams` works with the app-shipped team catalog in
`@bullpen/teams-catalog`. Browse, search, inspect, and file reads do not
change company state. `preview` runs the company import planner, and `install`
imports the catalog team into an existing company.

```sh
pnpm bullpen teams browse [--kind bundled|optional] [--category <slug>] [--query <text>]
pnpm bullpen teams search "<text>" [--kind bundled|optional] [--category <slug>]
pnpm bullpen teams inspect <catalog-id-or-key-or-slug> [--file TEAM.md]
pnpm bullpen teams preview <catalog-id-or-key-or-slug> --company-id <company-id>
pnpm bullpen teams install <catalog-id-or-key-or-slug> --company-id <company-id>
```

Preview/install options:

- Under agent authentication, use `bullpen company list --json`,
  `bullpen company current --json`, or `BULLPEN_COMPANY_ID` to select the
  target company. `company list` falls back to the scoped current company when
  board-wide listing is forbidden. `teams install` creates agents and therefore
  requires board authentication, an `agents:create` grant, or an agent with
  explicit `canCreateAgents` permission.
- `--request-approval-on-forbidden` turns a 403 install denial into a linked
  board approval request instead of a raw failed command; use
  `--approval-issue-id <id>` to attach it to a specific issue. During Bullpen
  task runs with `BULLPEN_TASK_ID` set, this fallback is automatic so
  agent-run walkthroughs leave a pending approval path instead of a raw 403.
- `--target-manager-agent-id <id>` or `--target-manager-slug <slug>` reparents
  catalog root agents under an existing manager.
- `--agent <slug>` and `--selected-file <path>` narrow the import.
- `--collision-strategy rename|skip|replace` controls name/key collisions.
- `--allow-external-sources`, `--allow-unpinned-optional-sources`, and
  `--allow-local-path-sources` explicitly opt into higher-trust source policy.
  Local-path sources are development-only and stay blocked unless that flag is
  passed.

## Secrets Commands

```sh
pnpm bullpen secrets list --company-id <company-id>
pnpm bullpen secrets declarations --company-id <company-id> [--include agents,projects] [--kind secret]
pnpm bullpen secrets create --company-id <company-id> --name anthropic-api-key --value-env ANTHROPIC_API_KEY
pnpm bullpen secrets link --company-id <company-id> --name prod-stripe-key --provider aws_secrets_manager --external-ref <provider-ref>
pnpm bullpen secrets doctor --company-id <company-id>
pnpm bullpen secrets provider-configs --company-id <company-id>
pnpm bullpen secrets provider-config:create --company-id <company-id> --payload-json '{...}'
pnpm bullpen secrets provider-config:discovery-preview --company-id <company-id> --payload-json '{...}'
pnpm bullpen secrets provider-config:get <config-id>
pnpm bullpen secrets provider-config:update <config-id> --payload-json '{...}'
pnpm bullpen secrets provider-config:default <config-id>
pnpm bullpen secrets provider-config:health <config-id>
pnpm bullpen secrets provider-config:delete <config-id>
pnpm bullpen secrets remote-import:preview --company-id <company-id> --payload-json '{...}'
pnpm bullpen secrets remote-import --company-id <company-id> --payload-json '{...}'
pnpm bullpen secrets migrate-inline-env --company-id <company-id> [--apply]
```

Secret listing and declarations never print secret values. `create` accepts
`--value-env` so shell history does not capture the value. `link` records
provider-owned references without copying the secret value into Bullpen.
For AWS-backed secrets, `secrets doctor` reports missing non-secret provider
env and the expected AWS SDK runtime credential source; do not store AWS
bootstrap credentials in Bullpen secrets.

Per-company provider vaults (multiple vault instances per provider, default
vault selection, coming-soon GCP/Vault) can be configured from the board UI under
`Company Settings → Secrets → Provider vaults` or through the provider-config CLI
commands above. See the
[secrets deploy guide](../docs/deploy/secrets.md#provider-vaults) and
[API reference](../docs/api/secrets.md#provider-vaults) for the contract.

## Approval Commands

```sh
pnpm bullpen approval list --company-id <company-id> [--status pending]
pnpm bullpen approval get <approval-id>
pnpm bullpen approval create --company-id <company-id> --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]
pnpm bullpen approval approve <approval-id> [--decision-note "..."]
pnpm bullpen approval reject <approval-id> [--decision-note "..."]
pnpm bullpen approval request-revision <approval-id> [--decision-note "..."]
pnpm bullpen approval resubmit <approval-id> [--payload '{"...":"..."}']
pnpm bullpen approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm bullpen activity list --company-id <company-id> [--agent-id <agent-id>] [--entity-type issue] [--entity-id <id>]
pnpm bullpen activity create --company-id <company-id> --payload-json '{...}'
pnpm bullpen activity issue <issue-id>
```

## Dashboard Commands

```sh
pnpm bullpen dashboard get --company-id <company-id>
```

## Org And Agent Config Commands

```sh
pnpm bullpen whoami
pnpm bullpen openapi
pnpm bullpen org get --company-id <company-id>
pnpm bullpen org svg --company-id <company-id> [--out org.svg]
pnpm bullpen org png --company-id <company-id> [--out org.png]
pnpm bullpen agent-config list --company-id <company-id>
```

## Access, Profile, And Instance Commands

```sh
pnpm bullpen profile session
pnpm bullpen profile get
pnpm bullpen profile update --payload-json '{...}'
pnpm bullpen profile company-user <user-slug> --company-id <company-id>
pnpm bullpen invite list --company-id <company-id>
pnpm bullpen invite create --company-id <company-id> --payload-json '{...}'
pnpm bullpen invite revoke <invite-id>
pnpm bullpen invite show <token>
pnpm bullpen invite accept <token> [--payload-json '{...}']
pnpm bullpen invite onboarding:text <token>
pnpm bullpen join list --company-id <company-id> [--status pending_approval]
pnpm bullpen join approve <request-id> --company-id <company-id>
pnpm bullpen join reject <request-id> --company-id <company-id>
pnpm bullpen join claim-key <request-id> --claim-secret <secret>
pnpm bullpen member list --company-id <company-id>
pnpm bullpen member update <member-id> --company-id <company-id> --payload-json '{...}'
pnpm bullpen member role-and-grants <member-id> --company-id <company-id> --payload-json '{...}'
pnpm bullpen member permissions <member-id> --company-id <company-id> --payload-json '{...}'
pnpm bullpen member archive <member-id> --company-id <company-id> [--payload-json '{...}']
pnpm bullpen admin user list [--query <text>]
pnpm bullpen admin user promote <user-id>
pnpm bullpen admin user demote <user-id>
pnpm bullpen admin user company-access <user-id>
pnpm bullpen admin user company-access:update <user-id> --payload-json '{...}'
```

CLI auth challenge endpoints are also exposed for tooling that needs the raw challenge lifecycle:

```sh
pnpm bullpen auth challenge create --payload-json '{...}'
BULLPEN_CHALLENGE_SECRET=<challenge-secret> pnpm bullpen auth challenge get <challenge-id> --token-env BULLPEN_CHALLENGE_SECRET
BULLPEN_CHALLENGE_SECRET=<challenge-secret> pnpm bullpen auth challenge approve <challenge-id> --token-env BULLPEN_CHALLENGE_SECRET
BULLPEN_CHALLENGE_SECRET=<challenge-secret> pnpm bullpen auth challenge cancel <challenge-id> --token-env BULLPEN_CHALLENGE_SECRET
pnpm bullpen auth revoke-current
```

`--token <challenge-secret>` is still supported for compatibility, but `--token-env` avoids putting challenge secrets in shell history or process arguments.

## Instance Settings Commands

```sh
pnpm bullpen instance scheduler-heartbeats
pnpm bullpen instance settings:general
pnpm bullpen instance settings:general:update --payload-json '{...}'
pnpm bullpen instance settings:experimental
pnpm bullpen instance settings:experimental:update --payload-json '{...}'
pnpm bullpen instance database-backup
```

Experimental features are opt-in and are provided without compatibility guarantees. They may break, change, or be removed at any time. Use them at your own risk.

```sh
pnpm bullpen sidebar preferences
pnpm bullpen sidebar preferences:update --payload-json '{...}'
pnpm bullpen sidebar project-preferences --company-id <company-id>
pnpm bullpen sidebar project-preferences:update --company-id <company-id> --payload-json '{...}'
pnpm bullpen sidebar badges --company-id <company-id>
pnpm bullpen inbox dismissals --company-id <company-id>
pnpm bullpen inbox dismiss --company-id <company-id> --payload-json '{"itemKey":"run:<run-id>"}'
pnpm bullpen board-claim show <token>
pnpm bullpen board-claim claim <token> [--payload-json '{...}']
pnpm bullpen openclaw invite-prompt --company-id <company-id> --payload-json '{...}'
pnpm bullpen available-skill list
pnpm bullpen available-skill index
pnpm bullpen available-skill get <skill-name>
pnpm bullpen llm agent-configuration
pnpm bullpen llm agent-configuration:adapter <adapter-type>
pnpm bullpen llm agent-icons
```

Hermes gateway uses the generic invite/join commands above rather than
`openclaw invite-prompt`. Create an agent invite, read
`invite onboarding:text`, submit a join request with
`adapterType: "hermes_gateway"` and `agentDefaultsPayload.apiBaseUrl` /
`agentDefaultsPayload.apiKey`, then approve and claim the key with the `join`
commands. See [HERMES_GATEWAY_ONBOARDING.md](./HERMES_GATEWAY_ONBOARDING.md).

## Adapter, Asset, And Skill Commands

```sh
pnpm bullpen adapter list
pnpm bullpen adapter install --payload-json '{"packageName":"@scope/adapter","version":"1.2.3"}'
pnpm bullpen adapter get <adapter-type>
pnpm bullpen adapter update <adapter-type> --payload-json '{"disabled":true}'
pnpm bullpen adapter override <adapter-type> --payload-json '{"paused":true}'
pnpm bullpen adapter reload <adapter-type>
pnpm bullpen adapter reinstall <adapter-type>
pnpm bullpen adapter delete <adapter-type>
pnpm bullpen adapter config-schema <adapter-type>
pnpm bullpen adapter ui-parser <adapter-type>
pnpm bullpen adapter models <adapter-type> --company-id <company-id> [--refresh] [--environment-id <id>]
pnpm bullpen adapter model-profiles <adapter-type> --company-id <company-id>
pnpm bullpen adapter detect-model <adapter-type> --company-id <company-id>
pnpm bullpen adapter test-environment <adapter-type> --company-id <company-id> --payload-json '{...}'
```

```sh
pnpm bullpen asset image:upload --company-id <company-id> --file ./image.png [--namespace docs] [--alt "..."]
pnpm bullpen asset logo:upload --company-id <company-id> --file ./logo.svg
pnpm bullpen asset content <asset-id> --out ./asset.bin
```

```sh
pnpm bullpen skill list --company-id <company-id>
pnpm bullpen skill get <skill-id> --company-id <company-id>
pnpm bullpen skill file <skill-id> --company-id <company-id> [--path SKILL.md]
pnpm bullpen skill create --company-id <company-id> --payload-json '{...}'
pnpm bullpen skill file:update <skill-id> --company-id <company-id> --payload-json '{...}'
pnpm bullpen skill import --company-id <company-id> --payload-json '{"source":"github:owner/repo/path"}'
pnpm bullpen skill scan-projects --company-id <company-id> --payload-json '{...}'
pnpm bullpen skill update-status <skill-id> --company-id <company-id>
pnpm bullpen skill install-update <skill-id> --company-id <company-id>
pnpm bullpen skill delete <skill-id> --company-id <company-id>
```

## Cost, Finance, And Budget Commands

```sh
pnpm bullpen cost summary --company-id <company-id>
pnpm bullpen cost by-agent --company-id <company-id>
pnpm bullpen cost by-agent-model --company-id <company-id>
pnpm bullpen cost by-provider --company-id <company-id>
pnpm bullpen cost by-biller --company-id <company-id>
pnpm bullpen cost by-project --company-id <company-id>
pnpm bullpen cost window-spend --company-id <company-id>
pnpm bullpen cost quota-windows --company-id <company-id>
pnpm bullpen cost issue <issue-id>
pnpm bullpen cost event:create --company-id <company-id> --payload-json '{...}'
```

```sh
pnpm bullpen finance event:create --company-id <company-id> --payload-json '{...}'
pnpm bullpen finance events --company-id <company-id>
pnpm bullpen finance summary --company-id <company-id>
pnpm bullpen finance by-biller --company-id <company-id>
pnpm bullpen finance by-kind --company-id <company-id>
pnpm bullpen budget overview --company-id <company-id>
pnpm bullpen budget policy:upsert --company-id <company-id> --payload-json '{...}'
pnpm bullpen budget company:update --company-id <company-id> --payload-json '{...}'
pnpm bullpen budget agent:update <agent-id> --payload-json '{...}'
pnpm bullpen budget incident:resolve <incident-id> --company-id <company-id> [--payload-json '{...}']
```

## Workspace And Environment Commands

```sh
pnpm bullpen workspace list --company-id <company-id>
pnpm bullpen workspace get <execution-workspace-id>
pnpm bullpen workspace close-readiness <execution-workspace-id>
pnpm bullpen workspace operations <execution-workspace-id>
pnpm bullpen workspace update <execution-workspace-id> --payload-json '{...}'
pnpm bullpen workspace runtime-service <execution-workspace-id> start --payload-json '{...}'
pnpm bullpen workspace runtime-command <execution-workspace-id> run --payload-json '{...}'
```

```sh
pnpm bullpen environment list --company-id <company-id>
pnpm bullpen environment capabilities --company-id <company-id>
pnpm bullpen environment create --company-id <company-id> --payload-json '{...}'
pnpm bullpen environment get <environment-id>
pnpm bullpen environment leases <environment-id>
pnpm bullpen environment lease <lease-id>
pnpm bullpen environment update <environment-id> --payload-json '{...}'
pnpm bullpen environment delete <environment-id>
pnpm bullpen environment probe <environment-id>
pnpm bullpen environment probe-config --company-id <company-id> --payload-json '{...}'
```

```sh
pnpm bullpen project-workspace list <project-id>
pnpm bullpen project-workspace create <project-id> --payload-json '{...}'
pnpm bullpen project-workspace update <project-id> <workspace-id> --payload-json '{...}'
pnpm bullpen project-workspace delete <project-id> <workspace-id>
pnpm bullpen project-workspace runtime-service <project-id> <workspace-id> restart --payload-json '{...}'
pnpm bullpen project-workspace runtime-command <project-id> <workspace-id> run --payload-json '{...}'
```

## Plugin Commands

Existing plugin lifecycle commands remain available: `plugin init`, `list`, `install`, `uninstall`, `enable`, `disable`, `inspect`, and `examples`.

```sh
pnpm bullpen plugin ui-contributions
pnpm bullpen plugin tools
pnpm bullpen plugin tool:execute --payload-json '{...}'
pnpm bullpen plugin health <plugin-id>
pnpm bullpen plugin logs <plugin-id>
pnpm bullpen plugin upgrade <plugin-id>
pnpm bullpen plugin config <plugin-id> --company-id <company-id>
pnpm bullpen plugin config:set <plugin-id> --company-id <company-id> --payload-json '{"configJson":{...}}'
pnpm bullpen plugin config:test <plugin-id> --company-id <company-id> --payload-json '{"configJson":{...}}'
pnpm bullpen plugin jobs <plugin-id>
pnpm bullpen plugin job:runs <plugin-id> <job-id>
pnpm bullpen plugin job:trigger <plugin-id> <job-id> [--payload-json '{...}']
pnpm bullpen plugin webhook <plugin-id> <endpoint-key> [--payload-json '{...}']
pnpm bullpen plugin dashboard <plugin-id>
pnpm bullpen plugin bridge:data <plugin-id> --payload-json '{...}'
pnpm bullpen plugin bridge:action <plugin-id> --payload-json '{...}'
pnpm bullpen plugin bridge:stream <plugin-id> <channel> [--duration-ms 10000]
pnpm bullpen plugin data <plugin-id> <key> --payload-json '{...}'
pnpm bullpen plugin action <plugin-id> <key> --payload-json '{...}'
pnpm bullpen plugin local-folders <plugin-id> --company-id <company-id>
pnpm bullpen plugin local-folder:status <plugin-id> <folder-key> --company-id <company-id>
pnpm bullpen plugin local-folder:validate <plugin-id> <folder-key> --company-id <company-id> [--payload-json '{...}']
pnpm bullpen plugin local-folder:set <plugin-id> <folder-key> --company-id <company-id> --payload-json '{...}'
```

Feedback traces can be fetched directly by ID when automating export workflows:

```sh
pnpm bullpen feedback trace <trace-id>
pnpm bullpen feedback bundle <trace-id>
```

## Heartbeat Command

`heartbeat run` now also supports context/api-key options and uses the shared client stack:

```sh
pnpm bullpen heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100] [--api-key <token>]
```

## Local Storage Defaults

Local Bullpen data lives under the selected instance root. `BULLPEN_HOME` chooses the home directory and `BULLPEN_INSTANCE_ID` chooses the instance.

```text
~/.bullpen/                                     # BULLPEN_HOME
└── instances/
    └── default/                                  # instance root (BULLPEN_INSTANCE_ID)
        ├── config.json                           # runtime config
        ├── .env                                  # instance env file
        ├── db/                                   # embedded PostgreSQL data
        ├── data/
        │   ├── storage/                          # local_disk uploads
        │   └── backups/                          # automatic DB backups
        ├── logs/
        ├── secrets/
        │   └── master.key                        # local_encrypted master key
        ├── workspaces/                           # default agent workspaces
        ├── projects/                             # project execution workspaces
        ├── companies/                            # per-company adapter homes (e.g. codex-home)
        └── codex-home/                           # per-instance codex home (when not company-scoped)
```

Default paths for the canonical install:

- config: `~/.bullpen/instances/default/config.json`
- embedded db: `~/.bullpen/instances/default/db`
- logs: `~/.bullpen/instances/default/logs`
- storage: `~/.bullpen/instances/default/data/storage`
- secrets key: `~/.bullpen/instances/default/secrets/master.key`

Override base home or instance with env vars:

```sh
BULLPEN_HOME=/custom/home BULLPEN_INSTANCE_ID=dev pnpm bullpen run
```

## Storage Configuration

Configure storage provider and settings:

```sh
pnpm bullpen configure --section storage
```

Supported providers:

- `local_disk` (default; local single-user installs)
- `s3` (S3-compatible object storage)
