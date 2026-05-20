# Prompt Caching

SotuRail formats context so stable blocks appear before dynamic session data:

1. Static header
2. Stable project governance
3. Stable config
4. Stable repo map
5. Stable approved specs
6. Stable approved memory
7. Dynamic footer

The cache normalizer writes `.soturail/cache/blocks.jsonl` with block ids, source paths, hashes, stable order and token estimates.

## Dynamic Data

Dynamic data must stay after stable blocks:

- timestamps;
- raw ids;
- command status;
- recent logs;
- ephemeral user questions.

## Honesty

`estimated_cache_stability_score` is a local estimate. v0.1.0 never claims real provider cache hits unless imported metadata exists.
