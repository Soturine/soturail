use std::env;
use std::io::{self, Read};

fn raw_id(args: &[String]) -> String {
    args.windows(2)
        .find(|pair| pair[0] == "--raw-id")
        .map(|pair| pair[1].clone())
        .unwrap_or_else(|| "unknown".to_string())
}

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();
    if args.iter().any(|arg| arg == "--version" || arg == "-V") {
        println!("soturail-native 0.2.0");
        return;
    }

    let Some(command) = args.first() else {
        eprintln!("usage: soturail-native <reduce-generic|reduce-git|reduce-test> [--raw-id id]");
        std::process::exit(2);
    };

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
        _ => {
            eprintln!("unknown command: {}", command);
            std::process::exit(2);
        }
    };
    print!("{}", output);
}
