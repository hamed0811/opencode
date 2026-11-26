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
- The initial Concat MCP bridge starts only the installed Concat executable with `--mcp window`. It does not fall back to headless mode.
- The bridge passes a restricted environment to Concat. It does not pass arbitrary API keys or custom secret variables.
- The bridge exposes only an explicit Concat tool allowlist. Mutating tools require a native Electron confirmation that displays the tool name and arguments.
- Concat MCP access is not a sandbox for agent code. Concat retains its own project-root rules. Council Room does not set `CONCAT_MCP_ROOTS`.

## Current product behavior
- The desktop app runs six independent consultation roles, then a Critic and a Final Judge.
- Session events are stored locally and can be replayed from the history selector.
- The model catalog is loaded from the installed OpenCode CLI with `opencode models`.
- A session model and per-role model overrides can be selected in the desktop settings.
- Human approval records a decision only. It does not execute code or perform Git operations.
- Agent-driven code changes remain disabled until a real OS-level sandbox and controlled tool policy are implemented.
- Motion Studio requires Concat to be open with Settings > Automation > Scripts and apps enabled. The MCP bridge uses `window` mode so it fails instead of silently switching to headless mode.
- Workspace validation is not a security sandbox. OpenCode still runs with the current Windows user's permissions.
- Windows execution and installer behavior must be verified on a real Windows machine before release.


## CI installer artifact

The Windows CI job builds the unpacked application and the NSIS installer. It uploads the installer as the `Council-Room-Windows-Installer` workflow artifact for 14 days. The installer still requires a real target-machine smoke test before release.


## Read-only sandbox preflight

Before choosing a Windows isolation backend, run this read-only check from the repository root in PowerShell:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-sandbox-prerequisites.ps1
```

The script reports the Windows edition, virtualization support, optional Windows features, related services, and firewall profile defaults. It does not enable features or change firewall settings. The report alone does not prove that a secure sandbox is configured.
