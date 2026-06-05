# LLM-As-Judge Policy

SotuRail may eventually support optional LLM-as-judge evaluations for hallucination, clarity and evidence quality. This document defines the boundary before that feature exists.

## Default Policy

```txt
No LLM-as-judge call is required for normal SotuRail development, testing or release.
```

Default gates should be deterministic:

- schema validation;
- JSON parsing;
- keyword and section checks;
- file existence checks;
- redaction checks;
- golden output checks;
- snapshot diff checks;
- link/path checks where local.

## Optional Judge Mode

A future optional command could look like:

```bash
soturail eval judge --provider openai
soturail eval judge --provider groq
soturail eval judge --provider local
```

Required behavior:

- opt-in only;
- never uploads repo data without clear user action;
- stores provider, model, prompt hash, timestamp and result;
- separates judge results from deterministic release evidence;
- marks results as subjective/heuristic, not proof.

## Non-Goals

- no mandatory provider keys;
- no hidden telemetry;
- no judge score as the only release gate;
- no claim that a judge result proves correctness.
