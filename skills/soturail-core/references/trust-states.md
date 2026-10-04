# Trust states

Machine values are stable English identifiers in every locale; explain them to the user in their language.

| State | Who may assign it | Meaning |
|---|---|---|
| `candidate` | agent, provider, heuristic | proposed finding awaiting evidence |
| `inferred` | agent, provider, heuristic | derived from sources, not checked |
| `assumed` | agent | taken as true to proceed; must be stated |
| `unknown` | agent, SotuRail | not determinable from available sources |
| `unverified` | agent, SotuRail | no recorded evidence yet |
| `verified` | SotuRail only | backed by a recorded, current check (for example exit code 0 of a recorded run) |
| `stale` | SotuRail only | evidence no longer matches the workspace fingerprint |
| `blocked` | SotuRail only | a recorded check failed |
| `current` | SotuRail only | artifact matches the current workspace |
| `approved` | human via SotuRail policy | explicit human approval recorded |
| `ready` | SotuRail readiness gate | contract evidence is sufficient |

Authority ("may this actor act?") and readiness ("is the engineering evidence sufficient?") are separate gates; both must pass.

Saying "I checked it" does not produce `verified`. Recording the check does.
