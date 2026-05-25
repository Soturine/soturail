# Security Model

SotuRail reduces accidental damage from AI-assisted terminal use. It is not a sandbox and does not make untrusted commands safe.

## Blocked by Default

- `rm -rf`
- `sudo`
- `format`
- `dd if=`
- `curl | sh`
- `wget | sh`
- `del /s`
- `git push`

## Unsafe Confirmation

Dangerous commands can only run when the exact phrase is supplied:

```text
I_UNDERSTAND_THIS_CAN_DESTROY_DATA
```

This is intentionally verbose so accidental bypasses are unlikely.

## Raw Logs

Raw command logs remain on disk so compressed summaries can always be audited.

Raw logs may contain secrets. Do not commit `.soturail/raw/`. CLI expansion redacts probable secrets by default:

```bash
soturail expand <raw_id>
```

Exact raw output requires an explicit opt-in:

```bash
soturail expand <raw_id> --allow-raw --yes
```

MCP raw-log expansion also redacts probable secrets by default unless `allow_raw=true` is explicitly passed.

## MCP, Skills, Agents And Workflows

The MCP server does not expose arbitrary shell execution. Skill Rail exports are local files for human review; SotuRail does not auto-install unreviewed third-party skills.

Agent installs are dry-run-first and backup-first. Unknown global host config locations are not modified automatically.

Workflow Rail does not push, merge or delete worktrees automatically. Worktree support is local and review-oriented.

## Planned Policy Rail

Policy Rail turns safety defaults into explicit, inspectable local rules and approval decisions.

Possible future commands:

```bash
soturail policy rules
soturail policy doctor
soturail policy validate
soturail policy explain <id>
soturail policy queue
soturail policy approve <id>
soturail policy reject <id>
soturail policy auth-check
```

Planned example rules:

```txt
R01 deny sudo
R02 deny writing .env or secret files
R03 ask before rm -rf
R04 deny git push --force
R05 ask before npm publish
R06 deny --no-verify unless explicitly approved
R07 warn before direct push to main/master
R08 require evidence before release
R09 deny arbitrary shell exposure through MCP by default
R10 require explicit confirmation for raw log expansion
R11 backup before agent host config writes
R12 warn when agent docs contain probable secrets
R13 warn when JSON payloads have duplicate keys or unsafe ambiguity
```

Policy decisions should eventually be attached to workflow evidence, release evidence and MCP exposure reports.

See [policy-rail.md](policy-rail.md).

## Planned MCP Exposure Report

A future report should show:

- resources exposed;
- tools exposed;
- whether arbitrary shell is exposed;
- whether raw logs are redacted by default;
- which actions require approval;
- host-specific caveats.

## Planned Auth Rail Notes

Some projects need agent-readable authentication docs. A future optional Auth Rail can scaffold `AUTH.md` or `docs/auth.md` and validate that secrets, tokens and raw logs are not exposed to agents accidentally.

This is planned as documentation and policy support, not as a secret manager.

## Limitations

SotuRail does not isolate processes, prevent all shell tricks or replace OS permissions. Treat it as a policy and evidence layer.
