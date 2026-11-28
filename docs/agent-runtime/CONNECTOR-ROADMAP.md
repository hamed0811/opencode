# Connector Roadmap

Connector packages should use open protocols and official APIs. No connector should scrape private interfaces or bypass provider terms, authentication, or rate limits.

## Connector framework
- Manifest-based registry with semantic versioning.
- Typed operation schemas and capability-level permissions.
- OAuth 2.0/PKCE where supported; secrets in OS credential vault.
- Health check, test connection, disconnect, refresh and revoke.
- Rate-limit handling, retries with jitter, circuit breaker, timeout and cancellation.
- Audit records that redact credentials and sensitive payloads.
- Mock fixtures and contract tests.
- Disabled connector state if credentials/scopes are missing.

## Initial connectors (prioritized)
1. GitHub: repository, issue, PR, branch and review operations; read-only first; write operations require approval.
2. Google Drive/Docs/Sheets: search/read and draft/update operations through official APIs.
3. Gmail: search/read/draft first; sending requires approval.
4. Google Calendar: search/create/update; changes require approval.
5. Slack: search/read; sending/posting requires approval.
6. Telegram: bot API; inbound webhook/polling; outbound messages require approval.
7. Discord: official bot API; outbound messages require approval.
8. Microsoft 365: Graph-based Outlook, Calendar, OneDrive, Teams.
9. Notion: official API for search and pages.
10. YouTube: API-based search and channel/video metadata; publishing/upload only with approval.
11. WhatsApp: official Business Platform only; not consumer-account automation.
12. Instagram: Meta Graph API for eligible business/creator accounts and supported operations.
13. Browser: Playwright-based, sandboxed browser for user-authorized sites; sensitive actions require approval.
14. Filesystem: confined workspace operations, path allowlist and denylist.
15. Shell: isolated execution, command policy and per-run approval for risk.

## Default state
Connector definitions may be bundled and discoverable, but connections are inactive until configured. Read-only access can be enabled after authorization. No API keys, credentials, or accounts are bundled. Do not represent a connector as operational until its contract tests and live health check pass.

## Connector phases
- Phase A: registry, manifest, policy, health, mock connector and tests.
- Phase B: GitHub and local filesystem; then browser and shell sandbox.
- Phase C: Google, Microsoft, Slack, Notion and messaging.
- Phase D: social/video connectors limited to official APIs and eligibility.
