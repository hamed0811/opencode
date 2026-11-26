# Extensible Agent Platform Architecture

## Status

**Architecture baseline only.** This document records the product direction and implementation sequence. It does not claim that the listed connectors, languages, agent builder, or production security controls are implemented.

The work starts from the current Draft PR branch. It must stay isolated from `main`. No merge, stable release, or external account connection is authorized by this document.

## Product goal

Council Room will grow from a desktop multi-agent consultation workspace into an extensible agent platform.

A user must be able to:
- connect supported work services;
- create, configure, test, pause, and remove specialist agents;
- give each agent only the connectors and actions it needs;
- build workflows that coordinate multiple agents;
- work in common world languages and right-to-left languages;
- add new connectors, model providers, agent templates, and translations without rewriting the application core.

The platform must not promise universal access. Each integration depends on the service's official API, account type, region, permissions, review process, and rate limits.

## Architecture principles

1. **Plugin-first:** connectors, model providers, tools, agent templates, and language packs use versioned manifests and stable interfaces.
2. **Core stays small:** service-specific logic must not be placed in the UI or agent runtime.
3. **Official access:** use official APIs and documented OAuth flows. Do not scrape private pages or bypass platform restrictions.
4. **Least privilege:** each connection grants only the scopes needed for its selected actions.
5. **Human control:** sending, publishing, deleting, spending, changing permissions, and other consequential actions require explicit policy and approval.
6. **Secret isolation:** OAuth tokens and API keys stay in the main process or a dedicated credential service. They never enter renderer state, prompts, transcripts, logs, or Git.
7. **Fail closed:** missing credentials, expired permissions, unknown tools, invalid manifests, and policy failures stop the action.
8. **Provider neutral:** support cloud models, local models, and compatible gateways through provider adapters.
9. **Language neutral:** store content as Unicode. Keep interface translation separate from model language and content language.
10. **Observable:** every run has an audit trail with redaction, timestamps, connector identity, action, approval, and result.

## Target system map

```text
Desktop UI
  |-- Workspace / Projects
  |-- Connector Center
  |-- Agent Builder
  |-- Workflow Builder
  |-- Language & Accessibility
  |-- Approval Inbox / Audit
          |
Typed IPC boundary
          |
Application Core (Electron main process)
  |-- Identity & Session Manager
  |-- Permission / Policy Engine
  |-- Credential Vault Adapter
  |-- Connector Registry
  |-- Connector Runtime
  |-- Agent Runtime
  |-- Workflow Scheduler
  |-- Model Provider Router
  |-- Memory Service
  |-- Audit & Observability
          |
  |-- Official API connector plugins
  |-- MCP connector adapters
  |-- Local application adapters
  |-- Cloud / local model providers
  |-- Isolated execution backend (future; security gate required)
```

The renderer must not call external services with secrets. It sends typed requests to the main process. The main process checks the user, policy, scopes, approval, and input before it performs an action.

## 1. Connector platform

### Connector categories

Initial catalog targets, subject to official API access:

| Category | Candidate services | Notes |
|---|---|---|
| Email and calendar | Gmail, Google Calendar, Outlook, Microsoft 365 | OAuth, mailbox/calendar scopes, send approval |
| Messaging | Telegram, WhatsApp Business Platform, Discord, Slack | Bot/app setup and platform-specific permissions |
| Social publishing and insights | Instagram, Facebook Pages, LinkedIn, X, TikTok | Publishing and analytics vary by account, API tier, and review |
| Video | YouTube Data API | Channel permissions, upload quotas, and review |
| Files and knowledge | Google Drive, OneDrive, Dropbox, Notion | File and page scopes; read/write separated |
| Development | GitHub, GitLab, Jira | Repository/project scopes; branch protection respected |
| Meetings | Zoom, Google Meet | Availability depends on API and account policy |
| Automation | n8n, Make, Zapier, webhooks | Use official APIs or user-configured webhook endpoints |
| AI providers | OpenAI, Gemini, Anthropic, Groq, OpenRouter, compatible gateways, Ollama | Provider adapters; model capabilities and limits are explicit |

This is a candidate list, not a claim of current support. Prioritize connectors by API availability, user value, cost, region, and maintenance burden.

### Connector lifecycle

Every connector follows the same lifecycle:

1. Discover from the Connector Center.
2. Read its permissions, data handling, costs, and limitations.
3. Start the official authorization flow.
4. Validate the returned identity and granted scopes.
5. Store tokens in the credential vault.
6. Run a read-only connection test.
7. Enable only actions allowed by granted scopes and user policy.
8. Refresh tokens safely and report expired/revoked access.
9. Disconnect by revoking access where supported and deleting local credentials.

### Versioned connector manifest

Each plugin must declare:
- stable connector ID and version;
- display name and localized descriptions;
- publisher and trust status;
- official API documentation URL;
- authentication type;
- requested OAuth scopes;
- read, write, publish, delete, and administrative capabilities;
- supported actions with JSON input/output schemas;
- webhook events, if any;
- rate limits, quotas, and retry rules;
- data classification and retention requirements;
- minimum platform version;
- required secrets, stored by reference only;
- health check and test procedure.

The manifest is data, not executable policy. The policy engine remains authoritative.

### Connector implementation layers

- **Official API adapters:** preferred for Gmail, YouTube, GitHub, social platforms, and business services.
- **MCP adapters:** for compatible external tools. Treat MCP server metadata and output as untrusted. Apply an allowlist and schema validation.
- **Webhook adapters:** for inbound events. Verify signatures, timestamps, replay protection, and payload size.
- **Local adapters:** for installed desktop tools such as Concat. Use a supervised process and a narrow tool allowlist.

Do not build browser automation as the default connector method. Use it only when the service permits it and no stable API exists. Keep it isolated and disclose its fragility.

## 2. Authentication and credential security

- Prefer OAuth 2.1 authorization-code flow with PKCE for user connections.
- Validate state, issuer, redirect URI, and token audience where applicable.
- Request minimum scopes. Separate read and write consent.
- Store refresh tokens and API keys in Windows Credential Manager or another reviewed OS-backed vault.
- Keep credentials out of renderer memory, model prompts, agent memory, logs, exports, crash reports, and repository files.
- Redact secrets before persistence.
- Support token expiry, revocation, reauthorization, and disconnect.
- Never silently reuse one user's connection for another user or agent.
- Never send tokens to a model. The connector runtime attaches credentials only when it calls the service.
- Add a local development mode with test credentials and mock services.

## 3. Agent Builder

The Agent Builder must support no-code creation first, with advanced configuration available.

### Agent profile

An agent definition includes:
- unique ID and version;
- name, icon, and description;
- role, objective, and system instructions;
- input and output schemas;
- selected model provider and model;
- language preference and response format;
- allowed connectors and allowed actions;
- memory policy and retention;
- tools and workflow entry points;
- approval rules;
- runtime limits and retry policy;
- test cases and evaluation criteria.

### Agent templates

Initial template ideas:
- Executive / coordinator;
- Research analyst;
- Software engineer and code reviewer;
- Marketing planner;
- Social media content assistant;
- YouTube research and script assistant;
- Customer support assistant;
- Email and calendar assistant;
- Finance analyst;
- Project manager;
- Translator and localization assistant;
- Media production assistant.

Templates are starting points. They must not receive permissions automatically. The user selects connectors and scopes for each agent.

### Agent lifecycle

Draft → Configure → Validate → Test → Approve permissions → Activate → Monitor → Pause / Update / Archive.

Every agent must have:
- a preview of its instructions and tools;
- a test mode with mock or read-only connectors;
- a clear list of granted permissions;
- a run history and cost/usage summary;
- pause and revoke controls.

## 4. Multi-agent workflows

The workflow engine coordinates agents through typed tasks and explicit handoffs.

Required features:
- visual or structured workflow definition;
- triggers: manual, schedule, webhook, and approved application events;
- sequential, parallel, conditional, and human-approval steps;
- typed input/output contracts between agents;
- retry, timeout, cancellation, and idempotency;
- concurrency and budget limits;
- loop detection and maximum-step limits;
- run history, replay-safe recovery, and audit events;
- per-step model and connector selection.

An agent must not grant another agent more permission than the user granted to the workflow. The workflow inherits the intersection of the permissions of its owner, participating agents, and connected accounts.

## 5. Model provider router

Use a provider adapter interface. Each provider declares:
- API type and base URL;
- authentication method;
- supported models;
- context and output limits;
- tool-calling support;
- vision/audio support;
- structured-output support;
- streaming support;
- pricing or free-tier notes where known;
- timeout and retry behavior.

Support cloud providers, OpenAI-compatible endpoints, gateways, and local runtimes such as Ollama. Do not assume that a model supports tools because its provider supports tools.

The router must support per-agent model selection, fallback rules, rate-limit handling, and cost controls. It must never switch to a paid model without the user's configured policy.

## 6. Internationalization and language support

The goal is broad Unicode and localization support, not a fixed list of languages.

Requirements:
- UTF-8 throughout storage, APIs, logs, and exports;
- translation files separated from application code;
- locale-aware dates, numbers, currency, and plural rules;
- right-to-left layout support for Persian, Arabic, Urdu, and other RTL languages;
- mixed RTL/LTR text handling;
- searchable and accessible localized controls;
- per-user interface language;
- per-agent working language;
- per-workflow content language;
- language detection as a suggestion, not an irreversible decision;
- user-controlled translation and original-text preservation;
- font fallback for scripts not covered by the primary font;
- localized errors, onboarding, connector permission explanations, and approval dialogs.

Use a standard message format such as ICU MessageFormat. Do not translate IDs, API payload keys, code, or user content automatically.

## 7. Memory and data boundaries

Separate:
- user profile preferences;
- project knowledge;
- agent memory;
- workflow run state;
- connector data cache;
- audit records.

Every memory store must have an owner, purpose, retention policy, and access rule. Agents must not read another agent's private memory unless the user grants shared access. Provide export and deletion controls. Do not store full email, message, or file content by default when a smaller reference or summary is sufficient.

## 8. Security and approval policy

Actions are classified by risk:

- **Read:** fetch metadata or content. Allowed only within granted scopes.
- **Prepare:** draft an email, post, file change, or workflow. No external side effect.
- **Write:** create or update data. Requires an explicit permission policy.
- **Publish / Send:** external communication or publication. Require per-action or user-defined approval.
- **Delete / Admin / Spend:** destructive, permission-changing, or financial actions. Require strong confirmation and must not be enabled by default.

Additional rules:
- connector output is untrusted data;
- prompt injection in emails, pages, files, comments, and MCP results cannot change system policy;
- no arbitrary shell or code execution from connector plugins;
- plugin installation requires user consent and publisher/version checks;
- network access is allowlisted by the connector runtime;
- agent code execution remains disabled until the separate OS sandbox plan passes its negative tests;
- audit logs are append-only where practical and redact secrets.

## 9. Extensibility and compatibility

- Semantic versioning for connector and agent manifest schemas.
- Stable public plugin interfaces.
- Capability negotiation at startup.
- Compatibility checks before plugin activation.
- Signed or trusted plugin source metadata where possible.
- Plugin permissions displayed before installation.
- Test harness with contract tests and mock APIs.
- Deprecation policy and migration tools.
- No plugin can modify core permissions or bypass approval policy.

## 10. Delivery roadmap

### Phase A — Architecture and safety foundation
- [x] Record the extensible platform direction.
- [ ] Threat model and data-flow review for connectors and agents.
- [ ] Define connector manifest JSON Schema.
- [ ] Define provider adapter interface.
- [ ] Define agent definition JSON Schema.
- [ ] Define workflow contract and event model.
- [ ] Define credential vault interface.
- [ ] Add architecture decision records for major choices.

### Phase B — Core platform interfaces
- [ ] Connector registry and manifest validation.
- [ ] Connector Center UI with mock connectors.
- [ ] Permission and approval policy engine.
- [ ] Credential vault adapter.
- [ ] Provider router interface and mock provider.
- [ ] Agent definition storage and Agent Builder draft flow.
- [ ] Contract tests for all interfaces.

### Phase C — First end-to-end integrations
- [ ] GitHub read-only connector.
- [ ] Telegram bot connector, subject to bot token handling and user setup.
- [ ] Gmail read-only connector, subject to Google OAuth consent and verification.
- [ ] YouTube read-only channel/video connector.
- [ ] One local MCP connector, starting with the existing Concat integration.
- [ ] Read-only integration tests and clear permission screens.

### Phase D — Agents and workflows
- [ ] No-code Agent Builder.
- [ ] Agent template library.
- [ ] Sequential and parallel workflow execution.
- [ ] Human approval inbox.
- [ ] Agent memory boundaries.
- [ ] Usage, cost, and run monitoring.

### Phase E — Controlled write actions
- [ ] Draft and send email with approval.
- [ ] Draft and publish supported social content with approval.
- [ ] Telegram and other messaging actions with approval.
- [ ] GitHub branch and Draft PR flow with approval.
- [ ] Retry, idempotency, and duplicate-send protection.

### Phase F — Broad connector catalog
- [ ] Microsoft 365 and Outlook.
- [ ] WhatsApp Business Platform.
- [ ] Instagram and Facebook Pages.
- [ ] LinkedIn and X, subject to API access.
- [ ] Slack and Discord.
- [ ] Drive, OneDrive, Dropbox, and Notion.
- [ ] Jira, GitLab, Zoom, and other requested services.

### Phase G — Internationalization and release
- [ ] Localization framework and language packs.
- [ ] Persian and Arabic RTL validation.
- [ ] Add language packs based on user demand.
- [ ] Accessibility and keyboard navigation review.
- [ ] Security review, license decision, Windows device testing, and release gates.

Phases can overlap when their dependencies are met. Security, credential storage, and permission checks are prerequisites for any connector that performs a write action.

## 11. Acceptance criteria

The platform is not considered extensible until:
- a new mock connector can be added without editing core runtime code;
- invalid or over-privileged manifests are rejected;
- a user can connect and disconnect an account without exposing its token;
- an agent can be created from a template and tested without real side effects;
- an agent cannot call an action outside its granted permissions;
- a workflow can hand off typed data between two agents;
- a failed connector call stops dependent workflow steps;
- approval is required for configured sensitive actions;
- Persian RTL and English LTR can be used in the same session;
- an additional language pack can be added without changing application logic;
- all actions produce redacted audit events;
- tests cover expiry, revocation, rate limits, retries, cancellation, and duplicate prevention.

## Explicit non-goals

- Do not promise access to every service or every feature of a service.
- Do not bypass API restrictions, account verification, regional restrictions, or platform review.
- Do not collect user credentials through custom password forms when OAuth is available.
- Do not let agents install plugins, change permissions, send messages, publish content, spend money, or delete data without the configured approval path.
- Do not enable arbitrary code execution until the OS-level sandbox is verified.
- Do not merge this work or publish a stable release without owner approval.
