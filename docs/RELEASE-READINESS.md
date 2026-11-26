# Release Readiness

This checklist defines the minimum evidence required before Council Room can be called complete or receive a stable release.

## Current release decision

**NO-GO — preview only.**

The repository is public. Public visibility does not mean the project has an open-source license. The package currently declares `UNLICENSED`. The owner must select and approve a license before publishing a formal open-source release.

## Required gates

### 1. Product behavior
- [x] Parallel consultation roles.
- [x] Independent Critic and structured Final Judge.
- [x] Persistent session history and replay.
- [x] Cancellation and human decision records.
- [ ] Full end-to-end test with a real OpenCode installation.
- [ ] Verify model selection and provider failures on a real Windows device.
- [ ] Verify clean install, upgrade, uninstall, and data retention.

### 2. Security
- [x] Renderer Node.js integration disabled.
- [x] IPC requests restricted to the application window.
- [x] Child process environment uses an explicit allowlist.
- [x] Secret-like values are redacted before event persistence.
- [x] Workspace path validation.
- [ ] A tested OS-level sandbox for any future code execution.
- [ ] Deny-by-default network isolation enforced by the OS.
- [ ] Resource limits, process restrictions, and timeout behavior tested.
- [ ] Threat model and security review signed off.

Workspace path validation is not a sandbox. Until the sandbox gate passes, agent-driven code execution must remain disabled. The configuration must not claim that sandboxing is active.

### 3. Gateway and secrets
- [ ] Implement a real provider adapter.
- [ ] Store credentials in Windows Credential Manager or another reviewed secure store.
- [ ] Never expose credentials to the renderer, prompts, transcripts, logs, or Git.
- [ ] Test invalid credentials, provider timeouts, rate limits, and cancellation.
- [ ] Verify every provider profile against current official API documentation.

### 4. Git workflow
- [ ] Implement feature-branch creation from the configured base.
- [ ] Validate branch names and workspace repository identity.
- [ ] Review diffs before commit.
- [ ] Create Draft Pull Requests only after explicit human approval.
- [ ] Never push directly to `main`.
- [ ] Never merge or force-push automatically.
- [ ] Test rollback and interrupted operations.

### 5. Motion Studio and Concat
- [ ] Define the complete Motion Studio room schema and role prompts.
- [ ] Pass Concat MCP transport unit tests in CI.
- [ ] Verify MCP initialize, tools/list, version detection, and process cleanup on the target Windows device.
- [ ] Install Concat on the target Windows machine.
- [ ] Verify the Concat binary and version.
- [ ] Verify the initial supervised Concat MCP bridge through its documented interface.
- [ ] Test project creation, media import, timeline edits, preview, save, export, cancellation, and crash recovery.
- [ ] Handle Concat unavailable, process crash, timeout, and user cancellation.
- [ ] Keep Concat paths and permissions configurable. Do not hardcode user-specific paths.

### 6. Windows release
- [x] CI builds an unpacked Windows app.
- [x] CI builds an NSIS installer.
- [ ] Test installer on a clean Windows 10/11 device.
- [ ] Test app launch when OpenCode is missing.
- [ ] Test app launch when OpenCode is installed but not authenticated.
- [ ] Test upgrade and uninstall behavior.
- [ ] Add code signing or document the unsigned installer warning.
- [ ] Publish SHA-256 checksums for release artifacts.
- [ ] Verify logs do not contain secrets or private prompts.

### 7. Open-source release
- [ ] Select a license and confirm it is compatible with all included assets and dependencies.
- [ ] Replace the `UNLICENSED` package metadata after license approval.
- [ ] Add the approved LICENSE file.
- [ ] Add a contribution guide and code of conduct.
- [ ] Add issue templates and a security reporting policy.
- [ ] Tag a version only after all required gates pass.

## Release rule

Do not label the application stable or complete while any required security, Windows smoke-test, licensing, or end-to-end gate remains open. A passing CI build is necessary, but it does not prove that the application works correctly on the target laptop.
