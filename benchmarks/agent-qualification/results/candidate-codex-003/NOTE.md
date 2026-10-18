# Caveat

All arms ran with CODEX_HOME under the OS temp directory, so Codex ran without its helper binaries ("could not create PATH aliases"). Arm-to-arm comparison inside this run is fair (same condition for every arm); comparison with pilot-codex-002, which did not have this condition, is confounded. The stale-evidence mechanism behind pilot-codex-002's false-not-ready results is verified independently (unit tests and dogfood).
