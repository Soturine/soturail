# Native Runner

SotuRail v0.2.0 keeps TypeScript as the orchestration and public CLI layer. It also includes an optional Rust reducer binary named `soturail-native`.

Supported native commands:

- `soturail-native --version`
- `soturail-native reduce-generic`
- `soturail-native reduce-git`
- `soturail-native reduce-test`

The TypeScript CLI checks:

1. `native/soturail-native/target/release/soturail-native`
2. `dist/native/soturail-native`
3. `soturail-native` on PATH

If the binary is missing, SotuRail falls back to TypeScript reducers.
