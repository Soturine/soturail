use std::env;
use std::fs::{File, OpenOptions};
use std::io::{self, BufReader, Read, Write};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Instant;

fn raw_id(args: &[String]) -> String {
    args.windows(2)
        .find(|pair| pair[0] == "--raw-id")
        .map(|pair| pair[1].clone())
        .unwrap_or_else(|| "unknown".to_string())
}

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();
    if args.iter().any(|arg| arg == "--version" || arg == "-V") {
        println!("soturail-native 0.2.1");
        return;
    }

    let Some(command) = args.first() else {
        eprintln!("usage: soturail-native <reduce-generic|reduce-git|reduce-test|reduce-json|run> [options]");
        std::process::exit(2);
    };

    if command == "run" {
        std::process::exit(run_command(&args[1..]));
    }

    let mut input = String::new();
    if let Err(error) = io::stdin().read_to_string(&mut input) {
        eprintln!("failed to read stdin: {}", error);
        std::process::exit(1);
    }
    let id = raw_id(&args);
    let output = match command.as_str() {
        "reduce-generic" => soturail_native::reduce_generic(&input, &id),
        "reduce-git" => soturail_native::reduce_git(&input, &id),
        "reduce-test" => soturail_native::reduce_test(&input, &id),
        "reduce-json" => soturail_native::reduce_json(&input, &id),
        _ => {
            eprintln!("unknown command: {}", command);
            std::process::exit(2);
        }
    };
    print!("{}", output);
}

fn run_command(args: &[String]) -> i32 {
    let mut raw_log: Option<PathBuf> = None;
    let mut summary_json: Option<PathBuf> = None;
    let mut interactive = false;
    let mut command_start = None;

    let mut index = 0usize;
    while index < args.len() {
        match args[index].as_str() {
            "--raw-log" => {
                raw_log = args.get(index + 1).map(PathBuf::from);
                index += 2;
            }
            "--summary-json" => {
                summary_json = args.get(index + 1).map(PathBuf::from);
                index += 2;
            }
            "--interactive" => {
                interactive = true;
                index += 1;
            }
            "--reducer" => {
                index += 2;
            }
            "--" => {
                command_start = Some(index + 1);
                break;
            }
            _ => {
                command_start = Some(index);
                break;
            }
        }
    }

    let Some(start) = command_start else {
        eprintln!("native run requires a command after --");
        return 2;
    };
    let command_parts = &args[start..];
    if command_parts.is_empty() {
        eprintln!("native run requires a command after --");
        return 2;
    }
    let command_joined = command_parts.join(" ");
    if soturail_native::is_dangerous_command(&command_joined) {
        eprintln!("SotuRail native safety policy blocked destructive command: {}", command_joined);
        return 1;
    }

    let log_file = match raw_log {
        Some(path) => match OpenOptions::new().create(true).append(true).open(path) {
            Ok(file) => Some(Arc::new(Mutex::new(file))),
            Err(error) => {
                eprintln!("failed to open raw log: {}", error);
                return 1;
            }
        },
        None => None,
    };

    let mut child = match Command::new(&command_parts[0])
        .args(&command_parts[1..])
        .stdin(if interactive { Stdio::piped() } else { Stdio::null() })
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(child) => child,
        Err(error) => {
            eprintln!("failed to spawn command: {}", error);
            return 1;
        }
    };

    if interactive {
        if let Some(mut stdin) = child.stdin.take() {
            thread::spawn(move || {
                let _ = io::copy(&mut io::stdin(), &mut stdin);
            });
        }
    }

    let start_time = Instant::now();
    let stdout = child.stdout.take().expect("stdout pipe");
    let stderr = child.stderr.take().expect("stderr pipe");
    let out_log = log_file.clone();
    let err_log = log_file.clone();
    let out_handle = thread::spawn(move || tee_stream(stdout, io::stdout(), out_log));
    let err_handle = thread::spawn(move || tee_stream(stderr, io::stderr(), err_log));

    let status = match child.wait() {
        Ok(status) => status,
        Err(error) => {
            eprintln!("failed waiting for command: {}", error);
            return 1;
        }
    };
    let stdout_bytes = out_handle.join().unwrap_or(0);
    let stderr_bytes = err_handle.join().unwrap_or(0);
    let exit_code = status.code().unwrap_or(1);
    let wall_time_ms = start_time.elapsed().as_secs_f64() * 1000.0;
    let summary = format!(
        "{{\"engine\":\"native\",\"exit_code\":{},\"stdout_bytes\":{},\"stderr_bytes\":{},\"wall_time_ms\":{:.3},\"command\":{}}}\n",
        exit_code,
        stdout_bytes,
        stderr_bytes,
        wall_time_ms,
        json_string(&command_joined)
    );

    if let Some(path) = summary_json {
        if let Err(error) = std::fs::write(path, &summary) {
            eprintln!("failed to write summary json: {}", error);
            return 1;
        }
    } else {
        print!("{}", summary);
    }

    exit_code
}

fn tee_stream<R: Read, W: Write>(reader: R, mut terminal: W, log_file: Option<Arc<Mutex<File>>>) -> usize {
    let mut reader = BufReader::new(reader);
    let mut buffer = [0u8; 8192];
    let mut total = 0usize;
    loop {
        let read = match reader.read(&mut buffer) {
            Ok(0) => break,
            Ok(read) => read,
            Err(_) => break,
        };
        total += read;
        let chunk = &buffer[..read];
        let _ = terminal.write_all(chunk);
        let _ = terminal.flush();
        if let Some(file) = &log_file {
            if let Ok(mut guard) = file.lock() {
                let _ = guard.write_all(chunk);
                let _ = guard.flush();
            }
        }
    }
    total
}

fn json_string(value: &str) -> String {
    serde_json::to_string(value).unwrap_or_else(|_| "\"\"".to_string())
}
