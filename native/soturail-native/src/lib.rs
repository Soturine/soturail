pub fn reduce_generic(input: &str, raw_id: &str) -> String {
    let lines: Vec<&str> = input.lines().collect();
    let mut out = vec![
        "Native Generic Stream Summary".to_string(),
        format!("Raw log: soturail expand {}", raw_id),
        String::new(),
        "First lines:".to_string(),
    ];
    for line in lines.iter().take(25) {
        out.push((*line).to_string());
    }
    let important: Vec<&str> = lines
        .iter()
        .copied()
        .filter(|line| {
            let lower = line.to_ascii_lowercase();
            ["error", "warn", "fail", "exception", "traceback", "assertion", "denied", "timeout", "permission", "refused"]
                .iter()
                .any(|needle| lower.contains(needle))
        })
        .take(100)
        .collect();
    if !important.is_empty() {
        out.push(String::new());
        out.push("Important lines:".to_string());
        for line in important {
            out.push(line.to_string());
        }
    }
    if lines.len() > 45 {
        out.push(String::new());
        out.push(format!(
            "[Collapsed approximately {} middle lines. Recover with: soturail expand {}]",
            lines.len().saturating_sub(45),
            raw_id
        ));
    }
    out.push(String::new());
    out.push("Last lines:".to_string());
    for line in lines.iter().skip(lines.len().saturating_sub(20)) {
        out.push((*line).to_string());
    }
    out.join("\n") + "\n"
}

pub fn reduce_git(input: &str, raw_id: &str) -> String {
    let mut files = Vec::<String>::new();
    let mut preserved = Vec::<String>::new();
    for line in input.lines() {
        if let Some(rest) = line.strip_prefix("diff --git a/") {
            if let Some((file, _)) = rest.split_once(" b/") {
                files.push(file.to_string());
            }
            preserved.push(line.to_string());
        } else {
            let trimmed = line.trim();
            if trimmed.starts_with("@@")
                || trimmed.starts_with("On branch")
                || trimmed.starts_with("Changes")
                || trimmed.starts_with("Untracked files")
                || trimmed.starts_with("rename from")
                || trimmed.starts_with("rename to")
                || trimmed.starts_with("deleted file mode")
                || trimmed.starts_with("new file mode")
                || trimmed.starts_with("<<<<<<<")
                || trimmed.starts_with("=======")
                || trimmed.starts_with(">>>>>>>")
                || trimmed.starts_with("fatal:")
                || trimmed.starts_with("error:")
                || trimmed.starts_with("warning:")
            {
                preserved.push(line.to_string());
            }
        }
    }
    files.sort();
    files.dedup();
    preserved.sort();
    preserved.dedup();
    format!(
        "Native Git Output Summary\nRaw log: soturail expand {}\n\nChanged files ({}):\n{}\n\nPreserved status, errors, and hunk headers:\n{}\n",
        raw_id,
        files.len(),
        if files.is_empty() { "- none detected".to_string() } else { files.iter().map(|file| format!("- {}", file)).collect::<Vec<_>>().join("\n") },
        if preserved.is_empty() { "- none detected".to_string() } else { preserved.join("\n") }
    )
}

pub fn reduce_test(input: &str, raw_id: &str) -> String {
    let mut important = Vec::<String>::new();
    let mut summary = Vec::<String>::new();
    for line in input.lines() {
        let lower = line.to_ascii_lowercase();
        let is_important = ["fail", "failed", "error", "assertion", "expected", "received", "traceback", "caused by", ".test.", ".spec.", "build failed"]
            .iter()
            .any(|needle| lower.contains(needle));
        if is_important {
            important.push(line.to_string());
        }
        if ["test files", "tests", "snapshots", "time", "passed", "failed", "skipped"]
            .iter()
            .any(|needle| lower.contains(needle))
        {
            summary.push(line.to_string());
        }
    }
    important.sort();
    important.dedup();
    summary.sort();
    summary.dedup();
    format!(
        "Native Test Output Summary\nRaw log: soturail expand {}\n\nSummary counts:\n{}\n\nFailures, assertions, stack traces, and file paths:\n{}\n",
        raw_id,
        if summary.is_empty() { "- no explicit test summary detected".to_string() } else { summary.join("\n") },
        if important.is_empty() { "- no failure-looking lines detected".to_string() } else { important.join("\n") }
    )
}

pub fn reduce_json(input: &str, raw_id: &str) -> String {
    let parsed: serde_json::Result<serde_json::Value> = serde_json::from_str(input.trim());
    let Ok(value) = parsed else {
        return reduce_generic(input, raw_id);
    };
    let mut primitive_lines = Vec::<String>::new();
    collect_relevant_primitives(&value, "$", &mut primitive_lines);
    let mut array_lines = Vec::<String>::new();
    collect_array_summaries(&value, "$", &mut array_lines);
    let mut out = vec![
        "Native JSON Tool Payload Summary".to_string(),
        "Compressed representation; not intended to be parsed as original JSON.".to_string(),
        format!("Raw log: soturail expand {}", raw_id),
        String::new(),
        "Relevant primitive paths:".to_string(),
    ];
    if primitive_lines.is_empty() {
        out.push("- none detected".to_string());
    } else {
        primitive_lines.sort();
        primitive_lines.dedup();
        out.extend(primitive_lines.into_iter().take(160));
    }
    if !array_lines.is_empty() {
        out.push(String::new());
        out.push("Collapsed arrays:".to_string());
        out.extend(array_lines.into_iter().take(80));
    }
    out.join("\n") + "\n"
}

pub fn is_dangerous_command(command: &str) -> bool {
    let lower = command.to_ascii_lowercase();
    lower.contains("rm -rf")
        || lower.split_whitespace().any(|token| token == "sudo")
        || lower.split_whitespace().any(|token| token == "format")
        || lower.contains("dd if=")
        || lower.contains("curl ") && lower.contains("| sh")
        || lower.contains("curl ") && lower.contains("| bash")
        || lower.contains("wget ") && lower.contains("| sh")
        || lower.contains("del /s")
        || lower.contains("git push")
}

fn collect_relevant_primitives(value: &serde_json::Value, path: &str, out: &mut Vec<String>) {
    match value {
        serde_json::Value::Null => {
            let _ = path;
        }
        serde_json::Value::Bool(boolean) => {
            if relevant_path(path) || !*boolean || sample_path(path) {
                out.push(format!("{}: {}", path, boolean));
            }
        }
        serde_json::Value::Number(number) => {
            if relevant_path(path) || sample_path(path) {
                out.push(format!("{}: {}", path, number));
            }
        }
        serde_json::Value::String(text) => {
            if relevant_path(path) || relevant_text(text) {
                out.push(format!("{}: {:?}", path, text));
            }
        }
        serde_json::Value::Array(items) => {
            for (index, item) in items.iter().enumerate() {
                if index < 3 || contains_relevant(item) || index + 2 >= items.len() {
                    collect_relevant_primitives(item, &format!("{}[{}]", path, index), out);
                }
            }
        }
        serde_json::Value::Object(map) => {
            for (key, item) in map {
                collect_relevant_primitives(item, &format!("{}.{}", path, key), out);
            }
        }
    }
}

fn collect_array_summaries(value: &serde_json::Value, path: &str, out: &mut Vec<String>) {
    match value {
        serde_json::Value::Array(items) => {
            if items.len() > 12 {
                out.push(format!("{}: {} items", path, items.len()));
            }
            for (index, item) in items.iter().enumerate().take(8) {
                collect_array_summaries(item, &format!("{}[{}]", path, index), out);
            }
        }
        serde_json::Value::Object(map) => {
            for (key, item) in map {
                collect_array_summaries(item, &format!("{}.{}", path, key), out);
            }
        }
        _ => {}
    }
}

fn relevant_path(path: &str) -> bool {
    let lower = path.to_ascii_lowercase();
    ["status", "error", "message", "path", "file", "code", "reason"]
        .iter()
        .any(|needle| lower.contains(needle))
}

fn sample_path(path: &str) -> bool {
    let lower = path.to_ascii_lowercase();
    if !(lower.ends_with(".id") || lower.ends_with(".ok") || lower.ends_with(".status") || lower.ends_with(".path") || lower.ends_with(".file")) {
        return false;
    }
    let Some(index) = latest_array_index(&lower) else {
        return false;
    };
    index < 3 || index >= 100
}

fn latest_array_index(path: &str) -> Option<usize> {
    let close = path.rfind(']')?;
    let open = path[..close].rfind('[')?;
    path[open + 1..close].parse::<usize>().ok()
}

fn relevant_text(text: &str) -> bool {
    let lower = text.to_ascii_lowercase();
    ["error", "denied", "timeout", "failed", "exception", "traceback", "src/", "tests/"]
        .iter()
        .any(|needle| lower.contains(needle))
}

fn contains_relevant(value: &serde_json::Value) -> bool {
    match value {
        serde_json::Value::String(text) => relevant_text(text),
        serde_json::Value::Bool(boolean) => !*boolean,
        serde_json::Value::Array(items) => items.iter().any(contains_relevant),
        serde_json::Value::Object(map) => map
            .iter()
            .any(|(key, item)| primitive_relevance(key, item) || contains_relevant(item)),
        _ => false,
    }
}

fn primitive_relevance(key: &str, value: &serde_json::Value) -> bool {
    match value {
        serde_json::Value::Null => false,
        serde_json::Value::Bool(boolean) => !*boolean || relevant_path(key),
        serde_json::Value::String(text) => relevant_path(key) || relevant_text(text),
        serde_json::Value::Number(_) => relevant_path(key),
        _ => false,
    }
}
