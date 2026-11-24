# Getting started

## Install

```sh
pi install git:github.com/asantos00/pi-herdr-fork-tab
```

Start a new Pi session inside Herdr, or run `/reload` in an existing one.

## Fork a running session

1. Press `Ctrl+Shift+Y` while Pi is idle or working.
2. Choose a user prompt from the newest-first history list.
3. Herdr opens a new tab in the same space.
4. The fork runs the selected prompt while the original session continues.

Use `/fork-tab` when Pi is idle. Text after the command becomes the new tab name.

## Troubleshooting

- **The shortcut does nothing:** run `/reload`, then `/hotkeys` and confirm `Ctrl+Shift+Y` appears under extension shortcuts.
- **The extension says Herdr is required:** start Pi from a Herdr-managed terminal and confirm `HC_TERMINAL_ID` is present.
- **The tab cannot open:** confirm `hc --version`, `herdr-app --version`, and `herdr-app status` work in the source terminal.
- **The selected prompt has no text:** image-only prompts can create the fork, but the extension has no text task to submit automatically.
