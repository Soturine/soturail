# Candidate artifacts

Schema: `soturail.semantic.candidate.v1`. Shared fields:

- `kind`: `claim` | `impact` | `decision` | `question` | `interpretation`
- `producer`: `{ kind: "semantic-worker", host?, model?, skill?, capability? }`
- `verificationState`: `candidate` | `inferred` | `assumed` | `unknown` | `unverified`
- `sourceRefs`: `[{ path, lines?: { start, end }, symbol?, sha256? }]` — exact workspace paths, Unicode allowed
- `locale` (optional): `{ user?, project?, source?, output? }` — BCP 47 tag, `mixed` or `unknown`
- `confidence` (optional): `{ level, basis: "model-self-report" }` — metadata, not proof
- `rationale` (optional): short engineering summary; do not include hidden reasoning

Kind-specific fields:

| Kind | Required |
|---|---|
| `claim` | `statementOriginal` (source text verbatim), optional `claimType`, `translations: [{ locale, text, derived: true }]` |
| `impact` | `target` ref, `affected: [{ ref, relation }]` |
| `decision` | `questionOriginal`, `options`, `requiresHuman`, optional `proposed` |
| `question` | `questionOriginal`, `blocking` |
| `interpretation` | `summaryOriginal`, optional `conflictsWith` |

Example — a Spanish requirement in an English codebase:

```json
{
  "kind": "claim",
  "statementOriginal": "El pago debe rechazarse si la tarjeta está vencida.",
  "claimType": "business_rule",
  "sourceRefs": [{ "path": "docs/requisitos/pagos.md", "lines": { "start": 12, "end": 12 } }],
  "locale": { "user": "pt-BR", "source": "es" },
  "translations": [{ "locale": "en", "text": "Payment must be rejected when the card is expired.", "derived": true }],
  "verificationState": "unverified"
}
```

When two sources conflict (for example Portuguese and English docs), record both as candidates and an `interpretation` with `conflictsWith`; neither language wins by default — provenance and freshness decide.
