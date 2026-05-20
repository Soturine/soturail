import { spawn } from "node:child_process";
import type { Writable } from "node:stream";

export interface RunnerOptions {
  command: string;
  cwd?: string;
  interactive?: boolean;
  rawLogStream: Writable;
  terminalStdout?: Writable;
  terminalStderr?: Writable;
  env?: NodeJS.ProcessEnv;
}

export interface RunnerResult {
  exitCode: number;
  signal: NodeJS.Signals | null;
  rawText: string;
}

export class NativeRunnerAdapter {
  async run(options: RunnerOptions): Promise<RunnerResult> {
    const cwd = options.cwd ?? process.cwd();
    const stdoutTarget = options.terminalStdout ?? process.stdout;
    const stderrTarget = options.terminalStderr ?? process.stderr;
    const chunks: Buffer[] = [];

    return new Promise<RunnerResult>((resolve, reject) => {
      const child = spawn(options.command, {
        cwd,
        shell: true,
        stdio: ["pipe", "pipe", "pipe"],
        env: options.env ?? process.env,
        windowsHide: !options.interactive
      });

      const tee = (chunk: Buffer, target: Writable): void => {
        chunks.push(Buffer.from(chunk));
        options.rawLogStream.write(chunk);
        target.write(chunk);
      };

      child.stdout?.on("data", (chunk: Buffer) => tee(chunk, stdoutTarget));
      child.stderr?.on("data", (chunk: Buffer) => tee(chunk, stderrTarget));

      if (options.interactive && child.stdin && process.stdin.readable) {
        if (process.stdin.isTTY) {
          process.stdin.resume();
        }
        process.stdin.pipe(child.stdin);
      } else {
        child.stdin?.end();
      }

      const forwardSigint = (): void => {
        child.kill("SIGINT");
      };

      process.once("SIGINT", forwardSigint);

      child.once("error", (error) => {
        process.off("SIGINT", forwardSigint);
        if (options.interactive && child.stdin) {
          process.stdin.unpipe(child.stdin);
        }
        options.rawLogStream.end();
        reject(error);
      });

      child.once("close", (code, signal) => {
        process.off("SIGINT", forwardSigint);
        if (options.interactive && child.stdin) {
          process.stdin.unpipe(child.stdin);
        }
        options.rawLogStream.end(() => {
          resolve({
            exitCode: code ?? (signal ? 130 : 1),
            signal,
            rawText: Buffer.concat(chunks).toString("utf8")
          });
        });
      });
    });
  }
}
