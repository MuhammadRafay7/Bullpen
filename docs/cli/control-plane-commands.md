---
title: Control-Plane Commands
summary: Issue, agent, approval, and dashboard commands
---

Client-side commands for managing issues, agents, approvals, and more.

## Issue Commands

```sh
# List issues
pnpm bullpen issue list [--status todo,in_progress] [--assignee-agent-id <id>] [--match text]

# Get issue details
pnpm bullpen issue get <issue-id-or-identifier>

# Create issue
pnpm bullpen issue create --title "..." [--description "..."] [--status todo] [--priority high]

# Update issue
pnpm bullpen issue update <issue-id> [--status in_progress] [--comment "..."]

# Add comment
pnpm bullpen issue comment <issue-id> --body "..." [--reopen]

# Checkout task
pnpm bullpen issue checkout <issue-id> --agent-id <agent-id>

# Release task
pnpm bullpen issue release <issue-id>
```

## Company Commands

```sh
pnpm bullpen company list
pnpm bullpen company get <company-id>
pnpm bullpen company current [--company-id <company-id>]

# Export to portable folder package (writes manifest + markdown files)
pnpm bullpen company export <company-id> --out ./exports/acme --include company,agents

# Preview import (no writes)
pnpm bullpen company import \
  <owner>/<repo>/<path> \
  --target existing \
  --company-id <company-id> \
  --ref main \
  --collision rename \
  --dry-run

# Apply import
pnpm bullpen company import \
  ./exports/acme \
  --target new \
  --new-company-name "Acme Imported" \
  --include company,agents
```

With agent authentication, use `company list` or `company current` to resolve
the scoped company. `company list` first tries the board-wide list; if that is
forbidden, it falls back to `--company-id`, `BULLPEN_COMPANY_ID`, context, or
`/api/agents/me` and returns only that scoped company. `company create` requires
board/instance-admin authentication because it is an instance-wide setup
command.

## Agent Commands

```sh
pnpm bullpen agent list
pnpm bullpen agent get <agent-id>
```

## Skills Commands

```sh
# Browse app-shipped catalog skills without changing company state
pnpm bullpen skills browse [--kind bundled|optional] [--category software-development] [--query github]
pnpm bullpen skills search "pull request" [--json]

# Inspect catalog metadata and file inventory before install
pnpm bullpen skills inspect github-pr-workflow

# Install a catalog skill into the company skill library
# This does not attach the skill to any agent.
pnpm bullpen skills install github-pr-workflow --company-id <company-id>
pnpm bullpen skills install github-pr-workflow --as pr-flow --force --company-id <company-id>

# External sources still use import instead of catalog install
pnpm bullpen skills import ./skills/my-skill --company-id <company-id>
pnpm bullpen skills import owner/repo/path/to/skill --company-id <company-id>

# Attach desired company skills to an agent after install/import
pnpm bullpen skills agent sync <agent-id> --skill github-pr-workflow --company-id <company-id>
```

## Approval Commands

```sh
# List approvals
pnpm bullpen approval list [--status pending]

# Get approval
pnpm bullpen approval get <approval-id>

# Create approval
pnpm bullpen approval create --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]

# Approve
pnpm bullpen approval approve <approval-id> [--decision-note "..."]

# Reject
pnpm bullpen approval reject <approval-id> [--decision-note "..."]

# Request revision
pnpm bullpen approval request-revision <approval-id> [--decision-note "..."]

# Resubmit
pnpm bullpen approval resubmit <approval-id> [--payload '{"..."}']

# Comment
pnpm bullpen approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm bullpen activity list [--agent-id <id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard

```sh
pnpm bullpen dashboard get
```

## Instance Settings

```sh
pnpm bullpen instance settings:general
pnpm bullpen instance settings:general:update --payload-json '{...}'
pnpm bullpen instance settings:experimental
pnpm bullpen instance settings:experimental:update --payload-json '{...}'
```

Experimental features are opt-in and are provided without compatibility guarantees. They may break, change, or be removed at any time. Use them at your own risk.

## Heartbeat

```sh
pnpm bullpen heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100]
```
