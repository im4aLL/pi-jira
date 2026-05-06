# Jira MCP Pi Extension

This project-local Pi extension exposes a stdio Jira MCP server to Pi as tools:

- `jira_mcp_list_tools`
- `jira_mcp_call_tool`

## Server

By default, this extension connects to Atlassian's remote MCP server through `mcp-remote`:

```text
npx -y mcp-remote https://mcp.atlassian.com/v1/mcp
```

No project-local `.env` file is required. Authentication is handled by Atlassian OAuth/browser login.

## Optional environment override

If you need to point at another MCP server, set shell environment variables:

```dotenv
JIRA_MCP_COMMAND=npx
JIRA_MCP_ARGS=["-y","mcp-remote","https://mcp.atlassian.com/v1/mcp"]
```

Shell environment variables override defaults.

## Verify

Restart Pi or run:

```text
/reload
```

Then run:

```text
/jira-mcp-status
```

Then ask:

```text
Use jira-implementation-review for KA-123
```

```text
Fetch acceptance criteria of AB-7682
```
