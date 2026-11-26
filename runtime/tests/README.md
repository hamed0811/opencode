# Runtime Foundation Tests

Run on Node.js 18 or newer (CI uses Node 22):

```sh
node --test runtime/tests/*.test.cjs
```

The tests cover the prototype connector policy gate, locale direction/fallback and run lifecycle transitions. They do not yet validate Electron integration, external API credentials, sandboxing or live connector behavior.
