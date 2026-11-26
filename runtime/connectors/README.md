# Connector Runtime Prototype

This is a small, dependency-free prototype of a manifest registry. It is not yet connected to Electron UI, OAuth, or a credential vault.

- Read operations can run without approval.
- Any write/send/publish/delete operation requires context.approved=true.
- Connector registration validates the basic manifest shape.
- Implementations must not store secrets in manifests.
- Future work: schema validation, sandboxing, timeout, cancellation, audit, rate limits, secret vault, connector-specific contract tests.

Use this prototype only as a foundation. The approval context must be supplied by a trusted host, not by an agent model.
