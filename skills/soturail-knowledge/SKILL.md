---
name: soturail-knowledge
description: "Build and maintain source-backed project knowledge in SotuRail: compile docs into knowledge packs, check freshness against current sources, extract candidate business rules and surface conflicts between documents in any language. Use when asked to document, summarize the project, capture requirements or reconcile docs. Not for code changes. Combine with soturail-core."
license: Apache-2.0
metadata:
  soturail-schema: soturail.skill.v2
  soturail-uses: knowledge.compile knowledge.verify project.read context.select
---

# SotuRail Knowledge

Source-backed knowledge that knows when it is stale.

## Workflow

1. **Select sources** by meaning, including docs in other languages; read them through `project.read`.
2. **Compile** with `knowledge.compile`; it keeps a source map and hashes. You interpret meaning — the compiler only structures.
3. **Extract candidates.** Requirements and business rules become `claim` candidates (`claimType: business_rule`) with `statementOriginal` verbatim from the source, in its original language.
4. **Conflicts.** When sources disagree (for example a Portuguese spec and an English README), record both claims plus an `interpretation` with `conflictsWith`. Neither language wins by default; freshness and provenance decide, otherwise ask the human.
5. **Freshness.** Run `knowledge.verify` before relying on compiled knowledge; stale entries must be recompiled or re-attested.

## Constraints

- Compiled summaries never replace the source as evidence.
- Do not invent rules the sources do not state; mark assumptions as `assumed`.

## Done

Knowledge pack current, candidate rules cite sources, conflicts and open questions listed.
