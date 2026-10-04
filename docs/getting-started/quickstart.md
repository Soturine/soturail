# Quickstart

SotuRail v1.6 is a local-first, agent-native engineering control plane for AI-assisted software work. The preferred workflow is agent-first: install SotuRail, project its portable Skills into your host, then let the agent discover capabilities while SotuRail records evidence and readiness.

Requires Node.js 22 or newer.

## Install

```bash
npm install -g soturail
soturail --version
```

Or:

```bash
npx soturail@latest --help
```

## Initialize a project

From the repository root:

```bash
soturail init
soturail doctor
soturail index
```

Generated runtime state stays under `.soturail/`.

## Install Skills for your host

Claude Code:

```bash
soturail skills export --target claude --layout portable --install
```

Codex, Cursor or Gemini CLI:

```bash
soturail skills export --target codex --layout portable --install
soturail skills export --target cursor --layout portable --install
soturail skills export --target gemini --layout portable --install
```

Unknown/unverified host:

```bash
soturail skills export --target generic --layout portable --install
```

Then talk to the agent normally. You do not need to translate the task into a long SotuRail command sequence.

Examples:

```text
"Corrija o bug de login e verifique o impacto."
"Revise essa mudança e só considere pronta se a evidência estiver atual."
"Prepare a release, mas não publique nada sem aprovação."
```

## Inspect discovery manually

```bash
soturail skills discover
soturail capabilities list
soturail capabilities describe context.select
soturail mcp smoke
```

MCP-capable agents can discover the same catalog through `soturail.skills.list` and `soturail.capabilities`.

## Record objective evidence

```bash
soturail run -- npm test
soturail evidence report
```

For material work, use a Change Contract so scope, criteria and checks stay explicit. See [Usage](usage.md), [First Real Workflow](first-real-workflow.md) and [Contracts and Verification](../architecture/contracts-and-verification.md).

## Before a release

```bash
npm run build
npm run typecheck
npm test
npm run docs:check
npm audit
node dist/cli.js mcp smoke
node dist/cli.js self architecture --check
npm run release:check
```

Native Rust validation is optional for normal npm usage but is included in the project's release CI.
