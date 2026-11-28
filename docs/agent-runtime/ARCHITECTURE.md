# Agent Runtime Foundation

## Status
Foundation design for the Council Room multi-agent runtime. This repository is currently a desktop discussion prototype. This document defines the transition to a real, testable execution system.

## Principles
- Open source components and open, documented protocols first.
- Modular core. Connector modules and agent roles must not require core rewrites.
- Local-first and provider-neutral. OpenAI-compatible APIs, native provider adapters, and local models.
- Explicit least-privilege policy. No implicit approval for shell, destructive actions, credential access, or external writes.
- Multilingual UX and prompts. Locale packs, translation fallback, RTL support.
- Durable event history with traceable run and tool IDs.
- No secrets in logs, model context, commits, or exported reports.

## Proposed modules
1. Orchestrator: plan, route, delegate, evaluate, and finalize.
2. Agent registry: roles, capability declarations, versioned profiles.
3. Model router: provider/model capability discovery, retry, budget, and fallback.
4. Tool registry: typed contracts, policy checks, timeout, cancellation.
5. Connector runtime: isolated integrations with OAuth/API-key lifecycle and webhook support.
6. Event store: append-only run events; SQLite first, optional PostgreSQL later.
7. Execution sandbox: separate process/container where feasible; network deny-by-default.
8. UI: session, task, agent, connector, approval, and trace views.
9. Locale subsystem: Persian/English baseline, RTL-aware layout, locale packs.
10. Extension API: versioned plugin interfaces and manifest validation.

## Run lifecycle
queued -> planning -> executing -> reviewing -> completed | failed | cancelled | waiting_approval

Every transition is an event. Each task owns a run ID, correlation ID, parent run ID (for delegated work), and bounded retry policy.

## Connector contract
Each connector declares: id, version, license, capabilities, scopes, auth type, health check, operations, rate limits, data classification, and supported locales. Connector execution goes through policy and audit layers.

## Safe defaults
- Read-only connector operations enabled only after connection is configured.
- Writes, sending messages, publishing, deleting, and billing actions require per-operation policy and explicit approval.
- Secrets stored in OS credential store, never localStorage or plaintext files.
- Connector health and scopes visible in UI.
- Disconnect revokes/clears local token references.

## Scale path
Single-process modular runtime -> worker pool -> distributed queue/event store. Keep interfaces stable. Do not introduce distributed infrastructure before local reliability and tests.

## Acceptance gates
- Unit and contract tests for each module.
- Integration tests with fake connector servers.
- Permission tests and audit coverage.
- Failure recovery and cancellation tests.
- Localization and RTL smoke tests.
- Build and packaged Windows desktop smoke test.
