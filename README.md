# Council Room

A multilingual, modular, local-first agent orchestration desktop project. This repository is an independent project and is not affiliated with the OpenCode maintainers.

## Current status

The desktop UI is still a prototype. Runtime foundation modules are implemented on the `agent-runtime-foundation` branch. Do not treat demo UI statuses as live provider or connector health.

## Runtime foundation

- Agent run lifecycle with planning, execution, review, cancellation and event traces.
- Bounded task pool with configurable concurrency (1–64).
- Provider registry and OpenAI-compatible adapter.
- Provider model discovery and chat completion using API keys from environment variables.
- Desktop provider health-check IPC with a host allowlist and fixed secret-name mapping.
- Skill manifest registry. Skills provide instructions and capability declarations; they do not execute code.
- Connector manifest registry with host-issued approval tokens for non-read operations.
- Confined workspace filesystem connector for directory listing, text reads and approved writes.
- English and Persian locale bundles with RTL metadata.

## Provider setup

Register an OpenAI-compatible provider in the runtime with:
- `id`: stable provider identifier.
- `baseUrl`: API base URL ending in `/v1`.
- `model`: configured model identifier.
- `apiKeyEnv`: environment variable name that contains the API key.

The runtime reads the secret from the environment at request time. It does not store the secret in provider metadata or return it in normal errors. The desktop test button supports the current allowlist: OpenAI, OpenRouter, Groq, Z.ai and local OmniRoute. Other custom hosts are rejected by the desktop IPC boundary.

PowerShell example (set only the key you use, then launch from the same window):
```powershell
$env:OPENROUTER_API_KEY = "your-key"
$env:OMNIROUTE_API_KEY = "your-key"
npm run desktop
```

OpenAI-compatible gateways such as OmniRoute and OpenRouter can use this adapter. Native Anthropic and Gemini adapters are not included yet.

## Security and connector status

The connector registry is a framework, not a set of live integrations. No Gmail, Telegram, GitHub, Discord or other external connector is enabled by default. A trusted desktop/server host must own the approval authority. Do not expose approval tokens to model-generated input.

The workspace filesystem connector confines paths to its configured root and rejects symlink components. It is not a substitute for OS-level isolation. The current approval mechanism is an in-process prototype. It is not a substitute for a Windows Credential Manager integration or a hardened sandbox.

## Tests

Run all runtime tests:
```sh
node --test runtime/tests/*.test.cjs
```

GitHub Actions runs the runtime test suite on Ubuntu and Windows with Node.js 22.

## Remaining work

- The desktop UI can test configured OpenAI-compatible provider endpoints. Runtime agent and skill controls still need UI integration.
- Add native provider adapters and real user-configured provider smoke tests.
- Implement durable run/event storage.
- Add the GitHub connector. Workspace filesystem access is implemented with path confinement, but it is not an OS sandbox.
- Add OAuth and secure OS credential storage.
- Add sandboxed tool execution and audit logs.
- Replace mock UI states and actions with real runtime events and approvals.
- Add packaged Windows desktop smoke tests and load/failure-recovery tests.

See `docs/agent-runtime` for architecture, connector roadmap and localization requirements.
