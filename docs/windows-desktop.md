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
- Tool discovery checks executable names and version output. It does not prove that a tool can read files, run tests, or act as an agent.
- Project configuration is read by the main process from the bundled config directory.

## Current product limits
- The desktop companion sends one prompt to OpenCode.
- It does not run a multi-agent workflow.
- It does not provide a real judge, approval engine, Gateway connection, or GitHub PR workflow.
- Static dashboard content is sample data and is labelled as such.
- Windows execution and installer behavior must be verified on a real Windows machine before release.
