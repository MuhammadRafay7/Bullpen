# Bullpen MCP Server

Model Context Protocol server for Bullpen.

This package is a thin MCP wrapper over the existing Bullpen REST API. It does
not talk to the database directly and it does not reimplement business logic.

## Authentication

The server reads its configuration from environment variables:

- `BULLPEN_API_URL` - Bullpen base URL, for example `http://localhost:3100`
- `BULLPEN_API_KEY` - bearer token used for `/api` requests
- `BULLPEN_COMPANY_ID` - optional default company for company-scoped tools
- `BULLPEN_AGENT_ID` - optional default agent for checkout helpers
- `BULLPEN_RUN_ID` - optional run id forwarded on mutating requests

## Usage

```sh
npx -y @bullpen/mcp-server
```

Or locally in this repo:

```sh
pnpm --filter @bullpen/mcp-server build
node packages/mcp-server/dist/stdio.js
```

## Tool Surface

Read tools:

- `bullpenMe`
- `bullpenInboxLite`
- `bullpenListAgents`
- `bullpenGetAgent`
- `bullpenListIssues`
- `bullpenGetIssue`
- `bullpenGetHeartbeatContext`
- `bullpenListComments`
- `bullpenGetComment`
- `bullpenListIssueApprovals`
- `bullpenListDocuments`
- `bullpenGetDocument`
- `bullpenListDocumentRevisions`
- `bullpenListProjects`
- `bullpenGetProject`
- `bullpenGetIssueWorkspaceRuntime`
- `bullpenWaitForIssueWorkspaceService`
- `bullpenListGoals`
- `bullpenGetGoal`
- `bullpenListApprovals`
- `bullpenGetApproval`
- `bullpenGetApprovalIssues`
- `bullpenListApprovalComments`

Write tools:

- `bullpenCreateIssue`
- `bullpenUpdateIssue`
- `bullpenCheckoutIssue`
- `bullpenReleaseIssue`
- `bullpenAddComment`
- `bullpenSuggestTasks`
- `bullpenAskUserQuestions`
- `bullpenRequestConfirmation`
- `bullpenUpsertIssueDocument`
- `bullpenRestoreIssueDocumentRevision`
- `bullpenControlIssueWorkspaceServices`
- `bullpenCreateApproval`
- `bullpenLinkIssueApproval`
- `bullpenUnlinkIssueApproval`
- `bullpenApprovalDecision`
- `bullpenAddApprovalComment`

Escape hatch:

- `bullpenApiRequest`

`bullpenApiRequest` is limited to paths under `/api` and JSON bodies. It is
meant for endpoints that do not yet have a dedicated MCP tool.
