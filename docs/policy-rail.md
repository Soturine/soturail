# Policy Rail

Policy Rail is a planned SotuRail area for making risky agent-assisted actions explainable, reviewable and auditable.

It extends the current safety model without pretending SotuRail is a full sandbox. SotuRail remains a local policy and evidence layer.

## Product Boundary

Policy Rail should help answer:

```txt
Can this action run?
Why is it allowed or blocked?
What evidence proves the decision?
What safer alternative exists?
Who approved the risky step?
```

It should not replace OS permissions, containers, code review, CI or human judgment.

## Planned Commands

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

## Example Rule Set

Policy IDs should be stable and readable.

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

## Policy Queue

Risky actions should be queued before execution when possible.

A queue item should include:

- policy id;
- command or action;
- reason for risk;
- proposed safer alternative;
- workflow id;
- raw id or trace id;
- affected files;
- approval state;
- timestamp.

Example:

```txt
policy_id: R05
risk: npm publish changes public package state
action: npm publish --access public
state: pending
requires: human approval + release evidence pack
```

## Auth Rail Relationship

Some projects need agent-readable auth docs. Policy Rail can later support an optional Auth Rail.

Possible future files:

```txt
AUTH.md
docs/auth.md
.soturail/policy/auth.yml
```

Auth docs should explain:

- what credentials exist;
- what must never be committed;
- how to test auth without exposing secrets;
- which agent actions are allowed;
- how to rotate or revoke secrets;
- what raw logs may contain.

## MCP Exposure Report

Policy Rail should document and verify MCP safety.

A future report should show:

- resources exposed;
- tools exposed;
- whether arbitrary shell is exposed;
- whether raw logs are redacted by default;
- which actions require approval;
- host-specific caveats.

## Relationship With Existing Security Model

Current SotuRail behavior already blocks dangerous patterns and avoids arbitrary shell execution through MCP by default. Policy Rail turns that into explicit, inspectable project policy.

## Acceptance Criteria

Policy Rail should not be promoted until:

- existing safety defaults stay intact;
- risky actions have clear explanations;
- queue/approve/reject states are testable;
- policy decisions are attached to workflows/reports;
- raw secret exposure remains opt-in only;
- MCP remains safe by default.
