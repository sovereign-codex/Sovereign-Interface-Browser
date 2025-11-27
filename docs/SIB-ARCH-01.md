# SIB-ARCH-01 — Sovereign Interface Browser (SIB-core)

This document captures the Tyme-authored architecture for the Sovereign Interface Browser (SIB-core). It describes the macro-level layout, contracts between modules, and the way the runtime composes local storage, identity, GPT-backed reasoning, and the AVOT action bridge.

## High-level layout

```
SIB-core/
  public/
  src/
    app/
    ui/
    core/
    kodex/
      prompts/
    avot/
    gpt/
    identity/
    storage/
    guardian/
    config/
  docs/
  .github/workflows/
```

* **app** – UI composition and bootstrapping for the runtime shell.
* **ui** – Dumb/presentational components that surface status and accept commands (Omnibar, Viewport, TymePanel, HouseOfTymeRadial).
* **core** – Cross-cutting services (event bus, session tracking, command router) that bind UI to capabilities.
* **kodex** – Manifest-aware interpreter that loads SIOS manifests, prepares prompts, and parses natural-language commands to structured intents.
* **avot** – Registry and invocation bridge for AVOT operations (local tool calls, external resources, and mock actions for offline dev).
* **gpt** – GPT client integration and prompt marshalling.
* **identity** – Vault for user persona and keys, backed by local storage.
* **storage** – Local persistence utilities with graceful degradation when `localStorage` is unavailable.
* **guardian** – Policy guardrails and auditing hook.
* **config** – Static configuration (defaults, env types).

## Core data paths

1. **Input** – Omnibar emits a command string. The `CommandRouter` normalizes input and forwards to `GuardianLayer` for pre-flight checks.
2. **Interpretation** – `KodexCore` enriches the command with SIOS manifest context, base/guardian prompts, and session metadata. It can either deterministically parse command patterns or delegate to `GPTClient` for structured intent drafting.
3. **Action selection** – Parsed intents are matched against `AVOTBridge` registry entries. When no direct match exists, `KodexCore` will ask `GPTClient` for the closest operation descriptor and then resolve it back into a registry invocation.
4. **Execution** – `AVOTBridge` executes mock/local operations and returns a `CommandResult` which is published on the `EventBus`. Results are persisted into the `SessionManager` history for the `Viewport` to render.
5. **Identity + storage** – `IdentityVault` provides the active persona and preferences. `SIBStorage` persists them; both are available to the `TymePanel` and `KodexCore` for prompt context.
6. **Guardrails** – `GuardianLayer` inspects commands and intents and can veto/annotate them before execution.

## Prompts

* `prompts/baseSystemPrompt.txt` – Base system role prompt enumerating the responsibilities of SIB-core and how to present results.
* `prompts/guardianPrompt.txt` – Guardian persona prompt used by the `GuardianLayer` when auditing potentially risky actions.

## Extension points

* Replace the mock `GPTClient` transport with a production API client; the service is already async and accepts a `prompt` + optional `inputs` payload.
* Extend `registry.json` with new AVOT operations. Each operation advertises `id`, `name`, `description`, `inputSchema`, and `handler` metadata.
* Introduce additional view components under `ui/` without affecting the service layer contracts.

