# Windows Desktop

## Requirements
- Windows 10 or later.
- Node.js 22 or later.
- OpenCode CLI installed and available in PATH.

## Install and run
Run these commands in PowerShell from the repository folder:

```powershell
npm ci
$env:COUNCIL_WORKSPACE = "F:\\path\\to\\your\\workspace"
npm run desktop
```

If `COUNCIL_WORKSPACE` is not set, the app uses its private Electron user-data workspace.

## Build
```powershell
npm run check
npm run desktop:dir
npm run desktop:installer
```

## Security boundaries
- The renderer has no Node.js integration.
- IPC accepts requests only from the main application window.
- OpenCode runs only in the configured workspace.
- The child process receives an explicit environment allowlist. Arbitrary API keys and tokens from the parent process are not inherited.
- The open-path IPC method only opens existing paths inside the configured workspace.
- Workspace validation limits the process working directory. It is not an operating-system sandbox. OpenCode still runs with the current Windows user's permissions and may access other files through its own tools. Do not treat this as isolation from untrusted prompts or code.
- Tool discovery checks executable names and version output. It does not prove that a tool can read files, run tests, or act as an agent.
- Project configuration is read by the main process from the bundled config directory.

## Current product behavior
- The desktop app runs six independent consultation roles, then a Critic and a Final Judge.
- Session events are stored locally and can be replayed from the history selector.
- The model catalog is loaded from the installed OpenCode CLI with `opencode models`.
- A session model and per-role model overrides can be selected in the desktop settings.
- Human approval records a decision only. It does not execute code or perform Git operations.
- Agent-driven code changes remain disabled until a real OS-level sandbox and controlled tool policy are implemented.
- Workspace validation is not a security sandbox. OpenCode still runs with the current Windows user's permissions.
- Windows execution and installer behavior must be verified on a real Windows machine before release.
