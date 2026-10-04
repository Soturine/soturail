---
name: soturail-research
description: "Research a question for a SotuRail repository using sources with provenance: project docs, version-matched dependency documentation and external references, recording claims with citations and separating observed facts from marketing or assumptions. Use for library/API questions, comparisons, design options and external project evaluation. Not for changing code. Combine with soturail-core; feed results into soturail-change or soturail-knowledge."
license: Apache-2.0
metadata:
  soturail-schema: soturail.skill.v2
  soturail-uses: dependency.docs project.read context.select knowledge.compile
---

# SotuRail Research

Cited, version-aware, honest about what was observed.

## Workflow

1. **Frame** the question and the decision it informs.
2. **Local first.** Check project docs and existing decisions through `project.read`; `context.select` can hint candidates.
3. **Dependencies.** Match documentation to the version in the project's lockfile/manifest. `dependency.docs` is unavailable: fetch upstream docs yourself and record source URL + version.
4. **External projects.** Prefer code, tests, issues and primary docs over READMEs. Classify each idea as observed, benchmarked, adopt, adapt, provider, reference-only or reject — and say why.
5. **Record** findings as `claim` candidates with source references, keeping quotes in their original language and adding derived translations only when useful.
6. **Persist** durable knowledge with `knowledge.compile` when the project wants it.

## Constraints

- A README claim is not observed behavior; a curated list is not evidence of suitability.
- Respect licenses; do not copy code without a compatible license.
- Network access may require approval in the host.

## Done

Answer with citations, confidence stated as model metadata, open questions listed.
