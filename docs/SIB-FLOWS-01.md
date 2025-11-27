# SIB-FLOWS-01 — Runtime flows

The following flows reflect the Tyme deployment playbook for SIB-core. They are intentionally verbose so operators can trace state transitions during development.

## Boot flow

1. Load `default-config.json` and hydrate `SIBStorage` + `IdentityVault`.
2. Load the default SIOS manifest through `SIOSManifestLoader` inside `KodexCore`.
3. Register the manifest, base prompt, and guardian prompt with `KodexCore`.
4. Construct `AVOTBridge` with the manifest-defined operations and the static `registry.json`.
5. Initialize the UI shell (`ShellApp`) and broadcast a `system.ready` event on the `EventBus`.

## Command flow

1. Omnibar emits a `command` event with the raw string.
2. `CommandRouter` forwards the payload to `GuardianLayer.auditCommand`. If blocked, emit a `command.rejected` event.
3. `KodexCore` parses the command using heuristics; if the intent is ambiguous it asks `GPTClient` for a structured intent.
4. Resolve the intent into an `AVOT` operation and call `AVOTBridge.invoke`.
5. Publish the resulting `CommandResult` to `SessionManager` and the `Viewport`.

## Identity flow

1. On first load, `IdentityVault` seeds a default persona derived from the browser fingerprint (timestamp + random segment).
2. The vault exposes `getActiveIdentity`, `saveIdentity`, and `clearIdentity`, each persisting through `SIBStorage`.
3. `TymePanel` renders the active persona and allows manual refresh (future enhancement: UI editor).

## Guardian flow

1. `GuardianLayer` wraps the guardian prompt and optional policy metadata.
2. For each command, it returns an `AuditResult` indicating `allow`, `flag`, or `block` with a reason string.
3. Audit results are shown in the `Viewport` alongside execution results.

## Offline/local development

* `GPTClient` returns deterministic mock responses to avoid network calls.
* `AVOTBridge` includes built-in mock operations (diagnostics, manifest echo, and ping) so the UI remains interactive.
* Storage gracefully falls back to an in-memory store when `localStorage` is unavailable (e.g., SSR or locked-down environments).

