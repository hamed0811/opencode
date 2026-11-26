# Council Room

A multilingual, modular, local-first agent orchestration desktop project. This repository is an independent project and is not affiliated with the OpenCode maintainers.

## Status
The current desktop UI is a prototype. The agent-runtime foundation is being developed on the `agent-runtime-foundation` branch.

## Goals
- Modular agent orchestration and traceable task runs.
- Open-source connectors using official APIs and open protocols.
- Provider-neutral support for local models and compatible API services.
- Persian and English interface foundations with RTL support.
- Explicit approval and audit policy for external writes and risky tools.

## Development
The current desktop app is based on Electron. The foundation prototype is dependency-free CommonJS and locale JSON.

Run foundation tests:
```
node --test runtime/tests/*.test.cjs
```

See `docs/agent-runtime` for architecture, connector roadmap and localization requirements.
