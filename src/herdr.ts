export type HerdrLocation = {
  spaceId: string;
  tabId: string;
};

type CoreTerminal = {
  labels?: Record<string, string>;
};

type HerdrTab = {
  id?: string;
  name?: string;
};

type HerdrSpace = {
  tabs?: HerdrTab[];
};

type HerdrState = {
  spaces?: HerdrSpace[];
};

type SessionEntry = {
  id?: string;
  parentId?: string | null;
  type?: string;
  message?: {
    role?: string;
    content?: string | Array<{ type?: string; text?: string }>;
  };
};

export type ForkChoice = {
  label: string;
  forkFromId: string;
  draft: string;
};

export function parseHerdrLocation(stdout: string): HerdrLocation {
  let terminal: CoreTerminal;
  try {
    terminal = JSON.parse(stdout) as CoreTerminal;
  } catch {
    throw new Error("herdr-core returned invalid terminal data");
  }

  const spaceId = terminal.labels?.["herdr.space"]?.trim();
  const tabId = terminal.labels?.["herdr.tab"]?.trim();
  if (!spaceId || !tabId) {
    throw new Error("the current Pi terminal is not attached to a Herdr tab");
  }

  return { spaceId, tabId };
}

export function findTabName(stdout: string, tabId: string): string | undefined {
  let state: HerdrState;
  try {
    state = JSON.parse(stdout) as HerdrState;
  } catch {
    return undefined;
  }

  for (const space of state.spaces ?? []) {
    const tab = (space.tabs ?? []).find((candidate) => candidate.id === tabId);
    if (tab?.name?.trim()) return tab.name.trim();
  }
  return undefined;
}

function messageText(entry: SessionEntry): string {
  const content = entry.message?.content;
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text!.trim())
    .filter(Boolean)
    .join("\n\n");
}

export function forkChoices(entries: SessionEntry[]): ForkChoice[] {
  const userEntries = entries.filter(
    (entry) => entry.type === "message" && entry.message?.role === "user" && entry.parentId,
  );

  return userEntries.map((entry, index) => {
    const draft = messageText(entry);
    const summary = draft.replace(/\s+/g, " ").trim() || "[non-text message]";
    return {
      label: `${String(index + 1).padStart(2, "0")} · ${summary.slice(0, 100)}`,
      forkFromId: entry.parentId!,
      draft,
    };
  }).reverse();
}

export function forkTabName(requestedName: string, currentName?: string, sessionName?: string): string {
  const requested = requestedName.trim();
  if (requested) return requested.slice(0, 160);

  const source = currentName?.trim() || sessionName?.trim();
  return source ? `${source} · fork`.slice(0, 160) : "Pi session · fork";
}

export function tabNewArguments(options: {
  name: string;
  spaceId: string;
  cwd: string;
  sessionFile: string;
  task?: string;
}): string[] {
  return [
    "do",
    "tab.new",
    JSON.stringify({
      name: options.name,
      space: options.spaceId,
      folder: options.cwd,
      argv: ["pi", "--session", options.sessionFile],
      ...(options.task ? { task: options.task } : {}),
      focus: true,
    }),
  ];
}
