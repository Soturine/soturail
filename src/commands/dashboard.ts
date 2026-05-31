import type { Command } from "commander";
import { buildDashboard, dashboardDoctor, dashboardOpen } from "../core/dashboard-rail.js";

export function registerDashboardCommand(program: Command): void {
  const dashboard = program.command("dashboard").description("Build and inspect a static local SotuRail dashboard.");

  dashboard.command("build").description("Build static dashboard HTML and local data files.").action(async () => {
    process.stdout.write((await buildDashboard()).output);
  });

  dashboard.command("open").description("Print the local dashboard HTML path.").action(async () => {
    process.stdout.write(await dashboardOpen());
  });

  dashboard.command("doctor").description("Check dashboard files and no-network defaults.").action(async () => {
    process.stdout.write(await dashboardDoctor());
  });
}
