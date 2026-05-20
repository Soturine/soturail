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
