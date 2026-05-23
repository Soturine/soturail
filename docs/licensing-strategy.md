# SotuRail Licensing Strategy

This document explains the current licensing position of SotuRail.

It is not legal advice. For commercial distribution, open-source release, dual licensing, contributor agreements, or enforcement, consult a qualified legal professional.

## Current decision

SotuRail is moving away from MIT for the current repository state and future versions.

Current stance:

```text
All rights reserved.
No broad open-source permission is granted by default.
```

The repository can remain public for portfolio, planning, research, documentation and evaluation visibility, but public visibility does not grant broad reuse rights.

## Why not MIT now?

MIT is a permissive open-source license. It is good when the goal is adoption, forks, reuse, contributions and commercial use by others.

MIT is not a good fit when the goal is to prevent people from copying, repackaging, sublicensing, selling or commercializing the project.

## Historical MIT note

Previous published versions or copies that were explicitly released under MIT remain governed by the MIT terms that applied to those specific versions at the time of release.

A later reserved-rights notice does not retroactively remove permissions already granted for previous MIT releases.

This means:

```text
Old MIT releases stay MIT.
Current and future repository state can use a stricter notice.
```

## package.json status

For future versions, `package.json` should use:

```json
{
  "license": "UNLICENSED"
}
```

This communicates that the package is not being distributed under a standard open-source license.

## Repository notice

The root `LICENSE` file now acts as a reserved-rights notice instead of an MIT grant.

Recommended README language:

```text
SotuRail is not currently licensed as open source for the current repository state or future versions. All rights are reserved unless a later LICENSE file or written agreement explicitly grants permissions.
```

## What is allowed by default?

Allowed by default:

- viewing the repository through GitHub;
- reading documentation for evaluation;
- discussing the project;
- linking to the project.

Not granted by default:

- copying the source code;
- redistributing the project;
- sublicensing the project;
- selling the project;
- repackaging the project;
- commercial use;
- creating derivative works;
- using assets or branding in another product.

## Future options

SotuRail can later choose a different model:

### Keep all rights reserved

Best for strict control while the product direction is still forming.

### Dual license

Example:

```text
Community source-available license for public visibility.
Commercial license for paid/private usage.
```

### Open-core

Example:

```text
Core reducers open source.
Advanced memory, governance, CI automation, cloud features or native performance modules commercial/private.
```

### AGPL-3.0

Useful if you want open-source sharing obligations, especially for network/server modifications, but it still allows copying under its terms.

### MIT or Apache-2.0 later

Useful if broad adoption becomes more important than control.

## Contributor warning

If outside contributors are accepted later, the project should define contribution terms first.

Possible requirements:

- Contributor License Agreement, CLA;
- Developer Certificate of Origin, DCO;
- explicit statement that contributions are accepted under the project's current license terms.

## Dependency warning

Even with all rights reserved, SotuRail must respect the licenses of dependencies, models, datasets and copied snippets.

Before adding dependencies, check:

- package license;
- model license;
- dataset license;
- benchmark license;
- compatibility with SotuRail's distribution model.
