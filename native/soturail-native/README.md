# soturail-native

Optional Rust hot-path engine for SotuRail.

Rust is used for reducer and runner paths where startup overhead, streaming and low memory use matter. TypeScript remains the public CLI, policy orchestration and npm distribution layer.

Dependencies:

- `serde_json` is used only to parse JSON payloads for `reduce-json` and to emit compact summary metadata. It avoids a hand-written JSON parser while keeping the native crate small.

Normal `npm run build` does not require Rust.
