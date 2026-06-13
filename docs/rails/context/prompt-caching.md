# Prompt Caching

SotuRail formats context so stable blocks appear before dynamic session data:

1. `static_header`
2. `governance`
3. `config`
4. `repo_map`
5. `approved_specs`
6. `approved_memory`
7. `dynamic_footer`

The cache normalizer writes `.soturail/cache/blocks.jsonl` with block ids, source paths, hashes, stable order and token estimates.

## Dynamic Data

Dynamic data must stay after stable blocks:

- timestamps;
- raw ids;
- command status;
- recent logs;
- ephemeral user questions.

## Honesty

`estimated_cache_stability_score` is a local estimate. v0.2.0 never claims real provider cache hits unless imported metadata exists.
