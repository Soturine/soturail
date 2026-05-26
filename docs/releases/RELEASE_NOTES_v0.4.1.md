# SotuRail v0.4.1 - Agent Scaffold, Docs & UX Polish

SotuRail v0.4.1 polishes the v0.4 agent integration experience and fixes incomplete scaffold output from `soturail init`.

## Highlights

- `soturail init` now includes v0.4 agent docs.
- `soturail init` now includes agent examples.
- `soturail init` now includes workflow examples.
- `soturail agents doctor` now gives better next-step guidance.
- Workflow Rail list/show/close UX is clearer.
- Generated docs no longer include stale v0.1/v0.3 wording.
- `.gitattributes` reduces Windows line-ending noise.
- Release checks protect required GitHub workflow files.

## Install

```bash
npm install -g soturail@0.4.1
soturail --version
```

## Try it

```bash
soturail init
soturail context pack --target all
soturail agents doctor
soturail agents export --agent all
soturail mcp smoke
soturail workflow new "Try SotuRail"
soturail workflow list
```

## Security

SotuRail remains safe-by-default. MCP does not expose arbitrary shell execution.
