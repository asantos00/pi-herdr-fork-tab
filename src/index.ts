import { execFile } from "node:child_process";
import { unlink } from "node:fs/promises";
import { promisify } from "node:util";
import { SessionManager, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import {
  findTabName,
  forkChoices,
  forkTabName,
  parseHerdrLocation,
  tabNewArguments,
} from "./herdr.ts";

const execFileAsync = promisify(execFile);
const FORK_SHORTCUT = "ctrl+shift+y";

async function run(command: string, args: string[]): Promise<string> {
  const result = await execFileAsync(command, args, {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    timeout: 10_000,
  });
  return result.stdout;
}

async function forkIntoTab(ctx: ExtensionContext, requestedName = ""): Promise<void> {
  if (ctx.mode !== "tui") {
    ctx.ui.notify("Forking into a Herdr tab requires interactive mode", "error");
    return;
  }

  const terminalId = process.env.HC_TERMINAL_ID;
  if (!terminalId) {
    ctx.ui.notify("Forking into a tab requires a Herdr-managed terminal", "error");
    return;
  }

  const sessionFile = ctx.sessionManager.getSessionFile();
  if (!sessionFile) {
    ctx.ui.notify("The current session has no persisted conversation to fork", "error");
    return;
  }

  // Snapshot the branch immediately. This remains safe while the current agent
  // is streaming: completed entries and the active user prompt are persisted.
  const choices = forkChoices(ctx.sessionManager.getBranch());
  if (choices.length === 0) {
    ctx.ui.notify("The current session has no user message to fork from", "error");
    return;
  }

  const selectedLabel = await ctx.ui.select(
    "Fork into a new Herdr tab from…",
    choices.map((choice) => choice.label),
  );
  if (!selectedLabel) return;

  const selected = choices.find((choice) => choice.label === selectedLabel);
  if (!selected) {
    ctx.ui.notify("The selected history entry is no longer available", "error");
    return;
  }

  try {
    const terminal = await run("hc", ["get", terminalId, "--json"]);
    const { spaceId, tabId } = parseHerdrLocation(terminal);
    const appState = await run("herdr-app", ["ls"]);
    const name = forkTabName(requestedName, findTabName(appState, tabId), ctx.sessionManager.getSessionName());

    // Work on a separate manager so creating the branched session does not
    // replace the session in this Pi process.
    const source = SessionManager.open(sessionFile, ctx.sessionManager.getSessionDir(), ctx.cwd);
    const forkSessionFile = source.createBranchedSession(selected.forkFromId);
    if (!forkSessionFile) throw new Error("Pi could not persist the forked session");

    try {
      await run("herdr-app", tabNewArguments({
        name,
        spaceId,
        cwd: ctx.cwd,
        sessionFile: forkSessionFile,
        task: selected.draft,
      }));
    } catch (error) {
      await unlink(forkSessionFile).catch(() => undefined);
      throw error;
    }

    ctx.ui.notify(`Opened “${name}”`, "info");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.ui.notify(`Could not fork into a Herdr tab: ${message}`, "error");
  }
}

export default function herdrForkTab(pi: ExtensionAPI): void {
  pi.registerCommand("fork-tab", {
    description: "Choose a history point and fork it into a new Herdr tab",
    handler: async (args, ctx) => forkIntoTab(ctx, args),
  });

  pi.registerShortcut(FORK_SHORTCUT, {
    description: "Choose a history point and fork it into a new Herdr tab",
    handler: async (ctx) => forkIntoTab(ctx),
  });
}
