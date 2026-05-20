import { getWorkspacePaths, appendJsonl, readJsonl } from "./config.js";

export type MetricEventType =
  | "command_run"
  | "expand"
  | "omission_report"
  | "doctor_cache"
  | "response_format"
  | "rules_ingest"
  | "rules_check"
  | "hook_install"
  | "dedupe_hit"
  | "bench_run";

export interface MetricEvent {
  type: MetricEventType;
  created_at: string;
  raw_id?: string;
  command?: string;
  exit_code?: number;
  raw_tokens_estimated?: number;
  compressed_tokens_estimated?: number;
  estimated_cache_stability_score?: number;
  details?: Record<string, unknown>;
}

export class MetricsStore {
  constructor(private readonly root = process.cwd()) {}

  async append(event: Omit<MetricEvent, "created_at"> & { created_at?: string }): Promise<void> {
    const paths = getWorkspacePaths(this.root);
    await appendJsonl(paths.metricsFile, {
      ...event,
      created_at: event.created_at ?? new Date().toISOString()
    });
  }

  async readAll(): Promise<MetricEvent[]> {
    const paths = getWorkspacePaths(this.root);
    return readJsonl<MetricEvent>(paths.metricsFile);
  }
}
