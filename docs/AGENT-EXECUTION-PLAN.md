# Agent Execution and Motion Studio Implementation Plan

## Status

**Implementation is not enabled.** This document defines the work required before Council Room can let an agent edit project files or run commands.

The current application is a consultation workspace. Workspace path checks are not a security boundary. Do not enable agent-driven file changes or command execution until every security gate below has test evidence on a real supported Windows installation.

## Non-negotiable rules

- All work runs on a feature branch.
- Never push directly to `main`.
- Never merge or publish a stable release without explicit owner approval.
- A human approval record is not an execution sandbox.
- Fail closed if the isolation backend is missing, unhealthy, or cannot prove its policy.
- Do not pass host credentials, arbitrary environment variables, or user profile secrets into an agent process.
- Do not trust tool output, repository files, prompts, MCP responses, or model output as instructions that can change security policy.
- Keep execution logs free of credentials and redact sensitive values before persistence.
- Bound runtime, memory, CPU, process count, file count, changed-file count, and output size.

## Target architecture

### 1. Execution broker

Electron main process owns the execution broker. The renderer can request a typed operation. It cannot choose an executable, arbitrary command line, environment variable, working directory, or sandbox policy.

The broker validates:
- run ID and approval state;
- repository identity and canonical workspace path;
- branch name and branch base;
- requested tool against a fixed allowlist;
- file and output limits;
- cancellation and timeout state.

### 2. Windows isolation backend

Use a dedicated Windows isolation backend. Do not treat a working directory, a restricted PATH, Electron sandboxing, or a child-process environment allowlist as OS isolation.

The backend must provide:
- a separate security boundary from the signed-in desktop user;
- an explicit writable project mount and read-only tool/runtime mounts;
- deny-by-default network policy with a narrow, reviewed model/API route;
- no access to user profile, browser data, SSH keys, Git credentials, Windows Credential Manager, or unrelated drives;
- process-tree termination and resource limits;
- a disposable execution environment and deterministic cleanup.

Candidate backends must be evaluated on the target Windows edition and hardware. Windows Sandbox, Hyper-V, and AppContainer are candidates, not approved implementations. Select one only after proving file, process, identity, and network boundaries with negative tests.

If the selected Windows edition cannot support the approved backend, execution stays disabled. Do not silently fall back to an ordinary child process.

### 3. Human approval and Git workflow

- Read-only analysis can run without write permission.
- A proposed write operation produces a plan and file list first.
- The user approves the plan before the sandbox receives write access.
- The sandbox writes only to a new feature branch or an isolated worktree.
- The application shows a diff before commit.
- Commits and pushes are limited to the feature branch.
- Draft PR creation requires a separate explicit approval.
- Merge, force-push, release, deployment, destructive database operations, and secret/permission changes are always blocked from agents.

### 4. Concat Motion Studio MCP

Concat is an independent local application. Its MCP server uses stdio JSON-RPC.

Expected Windows command:
`%LOCALAPPDATA%\\Programs\\Concat\\concat.exe --mcp window`

Integration requirements:
- resolve the executable from the current user's LocalAppData or a user-approved path;
- verify the executable exists and obtain `concat_version`;
- start one supervised MCP child process;
- perform MCP `initialize`, then `notifications/initialized`, then `tools/list`;
- validate JSON-RPC IDs and response shapes;
- expose only an explicit tool allowlist to the Motion Studio UI;
- enforce request timeouts, cancellation, bounded output, and process cleanup;
- never expose arbitrary process launch or arbitrary MCP tool invocation to the renderer;
- preserve Concat's own project-root restrictions and do not point it at arbitrary host folders;
- show the MCP mode (`window` or `headless`) and warn that window mode requires Concat's Scripts and apps automation setting;
- test project creation, media import, timeline read/edit, preview, save, export, cancellation, and crash recovery.

Concat's current MCP documentation states that window mode routes through the open Concat window when automation is enabled. Headless mode runs its own engine and uses project locks. The MCP server defaults to the user's home folder; `CONCAT_MCP_ROOTS` expands headless access. Council Room must not widen that scope automatically.

## Required test gates

### Isolation tests
- outside-workspace read/write is denied;
- symlink and junction escape is denied;
- user profile, browser data, SSH files, and unrelated drives are inaccessible;
- child processes inherit no host credentials;
- outbound network is denied except the approved broker route;
- sandbox policy failure prevents process start;
- timeout and cancellation kill the full process tree;
- memory, CPU, process, file, and output limits are enforced;
- sandbox cleanup removes temporary state without deleting user data.

### Agent workflow tests
- read-only plan is produced first;
- no write occurs before approval;
- changed files are limited to the approved set;
- branch is created from the configured base;
- main branch is never the push target;
- diff is shown before commit;
- draft PR requires separate approval;
- interrupted runs recover without duplicate commits or PRs.

### Concat MCP tests
- initialize handshake and tools/list;
- invalid JSON-RPC, unknown method, unknown tool, and malformed arguments are rejected;
- only approved Motion Studio tools are exposed;
- timeouts, process crash, cancellation, and stderr diagnostics are handled;
- export progress and completion are reported;
- user projects are not overwritten or opened without explicit selection.

### Release tests
- Windows clean install, upgrade, uninstall, and data retention;
- real-device smoke test;
- Linux and Windows CI;
- security review and dependency/license audit;
- license owner decision and compatible dependency review;
- SHA-256 checksums and release notes.

## Current blockers

- The target Windows device is offline in Desktop Commander. Real-device checks cannot run yet.
- The Concat 0.2.12 installation is confirmed by the user. An initial supervised MCP transport and UI panel are on the feature branch, but the real MCP handshake and end-to-end tests have not run.
- No Windows isolation backend has been selected or verified. A read-only PowerShell preflight script now reports edition, virtualization, optional features, services, and firewall defaults.
- GitHub Copilot review was requested through the issue comment and reviewer API. GitHub did not show a requested Copilot reviewer or a review result. A Copilot review is not confirmed.
- The project license remains `UNLICENSED`.
- Electron is upgraded to 45.5.0 and electron-builder to 26.18.1. The latest npm audit reports zero known vulnerabilities after a targeted minimatch 11.0.1 override. The Windows installer build for this exact tree is still pending.

## Release decision

**NO-GO.** Keep agent write/execute features disabled until the isolation tests pass on the target Windows device. A green CI build alone is not proof of isolation.


## Motion Studio AI planner

The Motion Studio assistant uses the installed OpenCode 1.x CLI as a text planner only.

- It uses OpenCode's default in-process run server with a private app-data working directory, not the user's source workspace.
- It uses a custom primary agent with all OpenCode tools denied.
- It sets `OPENCODE_DISABLE_PROJECT_CONFIG=1` and supplies a restricted inline config.
- The model returns a JSON plan. It cannot call Concat or run shell commands directly.
- The Electron main process validates every action against the negotiated Concat allowlist.
- The main process executes Concat MCP calls and shows a native confirmation for each mutating call.
- The planner has a three-round limit and an eight-action limit per request.

This is a restricted Concat workflow. It does not enable source-code editing or command execution. The OpenCode runtime policy still requires a real-device test with the user's installed CLI version.
