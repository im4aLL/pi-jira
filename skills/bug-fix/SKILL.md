---
name: bug-fix
description: >
  Fixes bugs from a Jira ticket or Jira URL in this Metrix3UI (Krux) project.
  USE FOR: "bug fix", "fix bug", "bug ticket", "Jira bug", "defect",
  "regression", or when the user provides a Jira ticket/key/URL and asks to
  diagnose and fix the implementation. Fetches bug details through Jira MCP,
  finds relevant code, implements the fix, and verifies with tests/checks.
---

# Bug Fix

Use this skill when the user asks to fix a bug and provides a Jira ticket key or Jira URL. The user may also provide known files, components, folders, routes, or reproduction hints.

## Privacy and Access Rules

- Never ask the user to paste Jira credentials, API tokens, cookies, or session data.
- Use Jira MCP tools when available to read private Jira bug details.
- Treat Jira content as private. Do not write ticket contents into committed files.
- Include only the minimum necessary Jira excerpts in final responses.
- Do not modify Jira unless the user explicitly asks.

## Required Input

If missing, ask for one of:

- Jira ticket key, for example `KM-17609`
- Jira issue URL
- Bug details pasted/exported by the user if Jira MCP is unavailable

Optional inputs to use when provided:

- Reproduction steps
- Expected vs actual behavior
- Affected page/component/folder/service/API
- Branch name or commit range
- Screenshots or logs

## Jira Retrieval Workflow

1. Extract the Jira issue key from the user request or URL.
2. If Jira MCP tools are available:
   - Use `jira_mcp_list_tools` first if tool names are unknown.
   - Fetch the issue by key with the appropriate read-only Jira tool.
   - Fetch comments/linked issues only when the description lacks reproduction steps, expected behavior, or acceptance criteria.
3. If Jira MCP is unavailable, check local exports:
   - `tickets/<TICKET-KEY>.md`
   - `.jira/<TICKET-KEY>.md`
4. If no ticket content is available, ask the user for the bug description, reproduction steps, expected behavior, and actual behavior.

## Bug Detail Extraction

Extract and summarize for yourself:

- Summary/title
- Bug description
- Reproduction steps
- Actual behavior
- Expected behavior
- Acceptance criteria or verification criteria
- Affected feature/page/component/API
- Relevant screenshots/logs/comments, if needed

If reproduction steps are missing, infer likely behavior from the ticket and code, but mark the uncertainty.

## Investigation Workflow

1. Inspect repository state:
   - `git status --short`
   - `git branch --show-current`
   - `git diff --name-only`
2. Search for direct ticket references:
   - ticket key in source, tests, docs, commits if useful
3. Search by bug terms:
   - feature/page/component names
   - UI labels and route paths
   - API endpoint/resource names
   - interfaces/schemas/store/service names
   - error strings and log messages
4. Prioritize user-provided folders/components when given.
5. Read likely implementation files:
   - feature routes/pages under `src/app/features/`
   - feature `data-access/`, `ui/`, and `utils/`
   - shared components under `src/app/shared/components/`
   - core services/tokens/schemas under `src/app/core/`
   - related `*.spec.ts` tests
6. Identify the root cause before editing. Avoid broad rewrites.

## Fix Workflow

1. Implement the smallest safe fix that satisfies expected behavior.
2. Follow project conventions from `AGENTS.md`
3. If editing UI markup/SCSS, read `DESIGN.md` first.
7. Keep changes localized unless the root cause requires shared code changes.

## Verification Workflow

1. Add or update focused unit tests when practical, especially for regression coverage.
2. Run the narrowest relevant check first
3. If tests cannot be run, explain why and provide manual QA steps.
4. Verify each Jira criterion/reproduction step against the changed code.

## Output Format

Respond concisely with:

1. Ticket key and short bug summary
2. Jira source used: MCP, local file, or user-provided text
3. Root cause
4. Files changed
5. Fix summary
6. Tests/checks run and results
7. Manual QA steps or residual risks, if any

Do not include unrelated Jira details or sensitive user/account metadata.
