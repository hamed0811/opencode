# Council Room

**A Windows desktop multi-agent consultation workspace built around OpenCode.**

Council Room coordinates specialist agents, records their events, compares their findings, and produces a structured decision. It is designed to keep a human in control.

> **Status: Preview / not production-ready.** The current build supports consultation and decision records. It does not provide a verified operating-system sandbox or safe agent-driven code execution.

## Current capabilities

- Six specialist consultation roles run in parallel through the local OpenCode CLI.
- A separate Critic checks disagreements and missing evidence.
- A Final Judge returns a validated structured decision.
- Live session events are sent from Electron main process to the UI.
- Session history is stored locally as JSONL and can be replayed.
- A default model and per-role model overrides can be selected from the installed OpenCode model catalog.
- Windows process-tree cancellation is supported.
- An initial Concat MCP bridge and Motion Studio panel are being added on a feature branch. The bridge uses a fixed executable path, a restricted child environment, an explicit tool allowlist, and native confirmation for write operations. Real Windows validation is still pending.
- Human approval decisions are recorded. Approval does not execute code or merge changes.
- A Windows NSIS installer is built by CI.

## Not ready yet

- No OS-level sandbox is implemented.
- Agent-driven file changes and shell execution are disabled.
- Gateway credential storage and live provider integration are incomplete.
- Git branch and Pull Request operations are not implemented in the desktop UI.
- The initial Motion Studio panel and Concat MCP transport are in development. The real Concat handshake and end-to-end editing workflow are not yet verified.
- End-to-end tests against a real OpenCode installation are pending.
- Installation and smoke tests on a real Windows device are pending.
- The project license must be selected before the project can be presented as an open-source release.

Do not treat workspace path checks as a security boundary. OpenCode runs with the permissions of the Windows user who starts it.

## Requirements

- Windows 10 or later.
- Node.js 22 or later.
- OpenCode CLI installed and available in PATH.

## Run from source

Open PowerShell in the repository folder:

```powershell
npm ci
$env:COUNCIL_WORKSPACE = "F:\\path\\to\\your\\workspace"
npm run desktop
```

If `COUNCIL_WORKSPACE` is not set, the app uses its private Electron user-data workspace.

## Validate and build

```powershell
npm run check
npm run desktop:dir
npm run desktop:installer
```

The installer is written to `dist`. CI also builds a Windows installer artifact.

## Security

Read [Windows Desktop Security Notes](docs/windows-desktop.md) and [Release Readiness](docs/RELEASE-READINESS.md) before testing or distributing the app.

Report security issues privately to the repository owner. Do not publish exploit details in a public issue.

## Contributing

Contributions are welcome as review proposals while the project is in preview. Open an issue before large changes. Include reproduction steps, test output, and the reason for the change.

A formal open-source contribution license is not yet selected. Do not assume that public visibility grants permission to redistribute or relicense the code.

## Project links

- Repository: https://github.com/hamed0811/opencode
- Current hardening work: https://github.com/hamed0811/opencode/pull/1
