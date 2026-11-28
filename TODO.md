# TODO — Council Room

## Completed
- [x] Persian RTL desktop command-center prototype.
- [x] Agent run lifecycle and event trace foundation.
- [x] OpenAI-compatible provider adapter and provider registry.
- [x] Provider model discovery and chat contract tests with a local fake HTTP server.
- [x] Environment-only provider API key handling.
- [x] Skill manifest registry and validation tests.
- [x] Bounded task pool with concurrency limit and failure tests.
- [x] Optional append-only JSONL event persistence with secret-field redaction.
- [x] Connector manifest validation and host-issued approval-token prototype.
- [x] Confined workspace filesystem connector for directory listing, text reads and approved writes.
- [x] Desktop provider health-check IPC with a host allowlist and fixed secret-name mapping.
- [x] English and Persian locale bundles.
- [x] Runtime test suite passes on Ubuntu and Windows with Node.js 22.

## Remaining — required before production
- [ ] Integrate runtime, provider registry and skills into Electron IPC and UI.
- [ ] Replace mock agent statuses, approvals and buttons with real runtime state.
- [ ] Add native Anthropic and Gemini adapters; verify real provider credentials supplied by the owner.
- [ ] Add run-state snapshots and restart recovery. Event traces are persisted, but runs cannot yet resume after a restart.
- [ ] Implement GitHub connector with read-only operations first.
- [ ] Add OAuth lifecycle and Windows Credential Manager integration.
- [ ] Move approval authority into a trusted host boundary and add audit records.
- [ ] Add sandboxed shell/browser execution. Keep execution disabled until sandbox tests pass.
- [ ] Add provider and connector timeout, retry, rate-limit and cancellation policies.
- [ ] Add multi-agent integration, load, stress and failure-recovery tests.
- [ ] Build and smoke-test the packaged Windows installer and portable app.
- [ ] Review accessibility, localization coverage and security before release.

## Release gate
Do not call the application production-ready until every required item above has implementation evidence and passing tests. Do not merge to `main` without explicit owner approval.
