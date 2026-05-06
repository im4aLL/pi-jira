---
name: jira-implementation-review
description: >
  Finds and reviews implementation for a Jira ticket, then verifies local code
  against the ticket acceptance criteria using Jira MCP when available. USE FOR:
  "verify Jira ticket", "check acceptance criteria", "find implementation for
  ticket", "review changes against Jira", or validating whether code satisfies
  a private Jira issue.
---

# Jira Implementation Review

Use this skill to fetch a private Jira issue through the configured Jira MCP server (local or remote), find the relevant implementation in the repository, and verify the code against the ticket acceptance criteria.

## Privacy and Access Rules

- Never ask the user to paste Jira credentials, API tokens, cookies, or session data.
- Never write Jira credentials or ticket content containing sensitive data into committed files.
- Prefer Jira MCP tools when available.
- If Jira MCP tools are not available, ask the user to either configure the Jira MCP server or paste/export the ticket summary and acceptance criteria.
- Treat Jira content as private. Include only the minimum necessary excerpts in the final answer.

## Required Input

Ask for the Jira ticket key if missing, for example `KA-123`.

Optional user inputs:

- Branch name or commit range to inspect
- Whether to review only local changes or the full implementation
- Any known feature/page/component/API names

## Jira Retrieval Order

1. If Jira MCP tools are available, use them to fetch the issue by key.
2. If MCP returns linked issues, subtasks, or parent epic data that looks relevant, fetch those only when needed to understand acceptance criteria.
3. If no MCP Jira tool is available, check local exported ticket files:
   - `tickets/<TICKET-KEY>.md`
   - `.jira/<TICKET-KEY>.md`
4. If neither MCP nor local ticket files are available, ask the user to provide the ticket summary, description, and acceptance criteria.

## Jira MCP Guidance

Use the configured Jira MCP server whether it is local or remote. Do not assume hard-coded Jira tool names; remote MCP servers may expose different names or schemas.

If pi exposes the Jira MCP bridge tools, use:

1. `jira_mcp_list_tools` to discover the Jira MCP server's actual tool names and available operations.
2. `jira_mcp_call_tool` to call the relevant Jira MCP tool exposed by that server.

If another harness exposes Jira MCP tools directly, use whatever Jira MCP tool names are exposed. Common operations to look for:

- Get issue by key
- Search Jira/JQL
- Get issue comments
- Get linked issues or subtasks

Fetch at minimum:

- Issue key
- Summary
- Description
- Acceptance criteria
- Relevant comments only if ACs are missing or ambiguous

Do not modify Jira from this skill unless the user explicitly asks.

## Acceptance Criteria Extraction

After fetching Jira data:

1. Identify explicit acceptance criteria sections such as `Acceptance Criteria`, `AC`, `Given/When/Then`, `Requirements`, or checklist items.
2. If the ticket has no clear ACs, derive a tentative checklist from the summary/description and label it as inferred.
3. Ask a clarifying question if the expected behavior cannot be reasonably determined.

## Implementation Discovery Workflow

1. Inspect repository state:
   - `git status --short`
   - `git branch --show-current`
   - `git diff --name-only`
2. Search for direct ticket references:
   - ticket key in source, tests, docs, commits if useful
3. Search by ticket terms:
   - feature names
   - UI labels
   - route paths
   - API/resource names
   - schema/interface names
   - acceptance criteria keywords
4. Read `AGENTS.md` for project conventions and library APIs.
5. Prefer project path aliases and architecture conventions when recommending fixes.

## Verification Workflow

For each acceptance criterion:

1. Map the criterion to concrete code evidence.
2. Verify UI behavior, route wiring, state handling, API parsing, validation, error states, and tests where relevant.
3. Mark static-code limitations clearly.
4. Identify missing or risky edge cases.
5. Recommend exact files/functions/components to change when gaps exist.

## Status Labels

Use these labels for each criterion:

- ✅ Met — code evidence clearly satisfies the criterion.
- ⚠️ Partially met — some evidence exists, but behavior is incomplete or risky.
- ❌ Missing — no sufficient implementation found.
- ❓ Cannot verify — requires runtime/backend/manual validation or missing context.

## Output Format

Respond with:

1. Ticket key and short summary
2. Jira source used: MCP, local file, or user-provided text
3. Implementation files reviewed
4. Acceptance criteria verification table:
   - Criterion
   - Status
   - Evidence
   - Gaps / notes
5. Tests found or missing
6. Recommended next changes, if any
7. Residual risks / manual QA items

Be concise, specific, and include file paths. Do not list non-issues.
