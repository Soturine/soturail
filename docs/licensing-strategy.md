# SotuRail Licensing Strategy

This document explains the current licensing position of SotuRail.

It is not legal advice. For commercial distribution, dual licensing, contributor agreements, enforcement, or company usage decisions, consult a qualified legal professional.

## Current decision

SotuRail is distributed under the **Apache License 2.0**.

Current stance:

```text
Apache-2.0
Permissive open-source license.
Commercial use is allowed.
Modification and redistribution are allowed under the license terms.
Patent grant is included under the Apache-2.0 terms.
```

The repository can remain public for development, documentation, evaluation, community feedback and adoption. Public visibility is now backed by an explicit open-source license instead of an all-rights-reserved notice.

## Why Apache-2.0?

Apache-2.0 is a good fit for SotuRail because the project is a developer tool, CLI package and local-first framework for AI coding agents.

It allows:

* personal use;
* commercial use;
* modification;
* redistribution;
* private use;
* forks and integrations;
* use in developer tooling and internal company workflows.

It also includes an explicit patent grant, which makes it more suitable than a very minimal permissive license for a tool that may be used by companies, agent hosts, CI systems, plugin ecosystems and automation workflows.

## Historical license note

Older published versions or copies remain governed by the license terms that applied to those specific versions at the time of release.

This means:

```text
Old releases keep their original license terms.
Current and future releases use Apache-2.0 unless changed later.
```

A later license change does not retroactively remove permissions that were already granted for older versions.

## package.json status

`package.json` should use:

```json
{
  "license": "Apache-2.0"
}
```

The root package entry in `package-lock.json` should also reflect:

```json
{
  "license": "Apache-2.0"
}
```

## Repository notice

The root `LICENSE` file should contain the full Apache License 2.0 text.

Recommended README badge:

```md
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
```

Recommended README language:

```text
SotuRail is licensed under the Apache License 2.0.
```

Or:

```text
SotuRail is distributed under the Apache License 2.0. You may use, copy, modify, distribute and build on the project under the Apache-2.0 terms.
```

## What is allowed by default?

Apache-2.0 allows, under its terms:

* viewing the repository;
* copying the source code;
* modifying the source code;
* redistributing the project;
* using the project commercially;
* creating derivative works;
* using the project privately;
* contributing improvements;
* integrating SotuRail into other developer workflows.

Users must still follow the Apache-2.0 license requirements, including preserving copyright and license notices.

## What is not provided?

Apache-2.0 does not provide:

* warranty;
* liability protection for users;
* trademark rights;
* permission to misuse SotuRail branding;
* a guarantee that the software is fit for a particular purpose;
* a guarantee that future versions will remain under the exact same license forever.

## Branding and trademark note

The Apache-2.0 license covers the software license. It does not automatically grant broad trademark or branding rights.

The names **SotuRail**, **Soturine**, logos, mascots and visual identity should be treated as project branding. If broader branding rules become necessary, add a separate trademark or brand usage policy.

## Contributor policy

If outside contributors are accepted later, the project should define contribution terms clearly.

Possible options:

* Developer Certificate of Origin, DCO;
* Contributor License Agreement, CLA;
* explicit statement that contributions are accepted under Apache-2.0;
* GitHub pull request template confirming contribution terms.

Recommended lightweight approach for now:

```text
By contributing to SotuRail, you agree that your contribution is submitted under the Apache License 2.0.
```

This can be added to `CONTRIBUTING.md`.

## Dependency warning

SotuRail must continue respecting the licenses of dependencies, models, datasets, copied snippets and benchmark fixtures.

Before adding dependencies, check:

* package license;
* model license;
* dataset license;
* benchmark license;
* compatibility with Apache-2.0 distribution;
* whether attribution or notice files are required.

## Future options

SotuRail can later choose a different model if the project direction changes.

### Continue with Apache-2.0

Best for broad adoption, community use, company usage, agent-host integrations and npm distribution.

### Dual license

Possible if a future commercial edition exists.

Example:

```text
Apache-2.0 for the open-source core.
Commercial license for private enterprise modules or hosted services.
```

### Open-core

Possible if advanced hosted, cloud, governance, native performance, team dashboard or enterprise policy features are added later.

Example:

```text
Core local Context OS under Apache-2.0.
Optional commercial/private modules for enterprise workflows.
```

### AGPL-3.0

Useful only if the goal becomes strong copyleft obligations, especially for network/server modifications. This is not the current SotuRail direction because SotuRail is currently a local-first CLI/developer tool.

## Current recommendation

Keep SotuRail under:

```text
Apache-2.0
```

This is the best balance for the current project:

* permissive;
* professional;
* npm-friendly;
* company-friendly;
* compatible with open-source adoption;
* clearer around patent rights than MIT;
* suitable for developer tooling and AI agent workflows.
