# First Real Workflow

This walkthrough shows the v1.6 agent-first flow in a fresh project.

## 1. Create a project and initialize SotuRail

```bash
mkdir my-soturail-test
cd my-soturail-test
git init
soturail init
soturail doctor
soturail index
```

SotuRail creates local state under `.soturail/` without requiring a hosted workspace.

## 2. Install portable Skills

For Claude Code:

```bash
soturail skills export --target claude --layout portable --install
```

For Codex:

```bash
soturail skills export --target codex --layout portable --install
```

Use `cursor`, `gemini` or `generic` as the target for those hosts.

## 3. Confirm discovery

```bash
soturail skills discover
soturail capabilities list
soturail mcp smoke
```

The bundled catalog should expose eight SotuRail Skills. MCP-capable hosts can discover Skills and capabilities without memorizing the CLI.

## 4. Ask the agent for real work

Example:

```text
"Corrija um bug simples neste projeto. Separe hipótese de fato e só considere pronto depois dos checks."
```

The agent should load the relevant SotuRail Skill(s), use project context progressively, and keep semantic conclusions as candidates until evidence supports them.

## 5. Record a real check

```bash
soturail run -- node --version
soturail evidence report
```

For a code project, replace the command with the project's actual test/build command.

## 6. Try a Change Contract

```bash
soturail contract create first-change \
  --title "First controlled change" \
  --intent "Exercise the verified change workflow" \
  --criterion "project check passes" \
  --check "node --version" \
  --criterion-check "node --version"

soturail run -- node --version
soturail contract verify .soturail/contracts/first-change.json
```

Readiness uses current recorded evidence. The contract creation baseline remains provenance rather than a permanent freshness blocker.

## 7. Inspect what was generated

Useful commands:

```bash
soturail status --json
soturail evidence report
soturail mcp exposure
soturail self architecture --check
```

Raw command output may contain secrets. Keep `.soturail/raw/` local and review any material before sharing it.
