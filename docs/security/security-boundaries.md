# Security Boundaries

SotuRail is a local-first, agent-native engineering control plane. It prepares and verifies context, contracts, evidence, workflows, capability metadata and host-facing artifacts, but it is not an operating-system sandbox or autonomous execution runtime.

## Safe defaults

- Local artifacts stay local unless the user explicitly moves or publishes them.
- Caller-controlled paths go through workspace/path guards.
- MCP does not expose arbitrary shell execution by default.
- Raw-log expansion is redacted for MCP callers.
- Agent/model output starts as candidate or assertion, not as verified truth.
- Readiness depends on current recorded evidence.
- Human/manual approval uses explicit interactive attestation rather than a caller boolean.
- Reports and exports use secret-redaction helpers.
- Knowledge and context artifacts preserve source/provenance information.
- Publishing, release creation, destructive actions and external writes remain explicit user-controlled actions.

## Trust boundary

SotuRail can prove facts that its deterministic tooling actually observes: hashes, workspace identity, schema validity, recorded runs, exit codes, evidence freshness and control-plane state transitions.

It cannot prove that:

- a physical human is present at the keyboard;
- a host obeyed every exported instruction;
- an external service completed an action unless that observation is captured as evidence;
- a hostile process is contained by the operating system.

## Out of scope

SotuRail is not:

- a model or cloud gateway;
- a mandatory web server or hosted workspace;
- a general autonomous coding runtime;
- an endpoint-security product;
- a secret manager;
- a destructive MCP tool provider;
- a model-serving or GPU-management platform.

## Future Conductor boundary

The proposed [SotuRail Conductor](../ecosystem/conductor-mode.md) remains optional future work. If implemented, it must consume the same contracts, evidence and approval boundaries rather than bypassing them.

## Related docs

- [Threat Model](threat-model.md)
- [Security Model](security-model.md)
- [MCP](../rails/hosts/mcp.md)
- [Verified Control Plane](../architecture/verified-control-plane.md)
- [Contracts and Verification](../architecture/contracts-and-verification.md)
