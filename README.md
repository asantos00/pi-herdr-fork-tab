# Pi Herdr Fork Tab

Fork a Pi conversation from any earlier user prompt into a new tab in the same Herdr space—even while the current agent is working.

## What it does

Press `Ctrl+Shift+Y` to open a history picker. Choose a prompt and the extension will:

1. copy the session history from immediately before that prompt;
2. create a new Pi session linked to the original;
3. open the session in a focused Herdr tab; and
4. run the selected prompt in the new tab.

The original session keeps running, so both paths can proceed at the same time.

## Requirements

- [Pi](https://github.com/earendil-works/pi)
- Current-generation Herdr with `herdr-app` and `hc` on `PATH`
- A Pi session running inside a Herdr-managed terminal

## Install

Install directly from GitHub:

```sh
pi install git:github.com/asantos00/pi-herdr-fork-tab
```

Reload an existing Pi session after installation:

```text
/reload
```

See the [getting-started guide](docs/getting-started.md) for troubleshooting.

## Use

### While Pi is working

Press:

```text
Ctrl+Shift+Y
```

The shortcut remains available while Pi is streaming or using tools.

### From the command line

Run the slash command when Pi is idle:

```text
/fork-tab
```

Give the new Herdr tab a custom name:

```text
/fork-tab Compare another approach
```

## How it works

The extension reads the active Pi branch through `SessionManager`, creates a branched session file without replacing the current process's session, then asks `herdr-app` to open a tab in the source space. The selected prompt is passed as the new tab's initial task.

The extension executes local `hc` and `herdr-app` commands and reads Pi's session metadata. It does not make network requests.

## Development

```sh
bun test
pi --no-extensions --extension ./src/index.ts --help
```

## License

MIT
