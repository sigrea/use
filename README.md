# @sigrea/use

`@sigrea/use` provides framework-agnostic Sigrea utilities for signals,
scopes, and browser APIs. It is intended for shared state, timing, watcher, and
browser logic that should not depend on Vue, React, or a template runtime.

- **Framework-agnostic utilities.** Use signal-powered helpers without binding to a UI framework.
- **Scope-aware cleanup.** Browser listeners, timers, workers, and observers can be cleaned up through Sigrea scopes.
- **SSR-safe imports.** Browser-dependent helpers avoid touching browser globals during module import.
- **Tree-shakable package.** ESM and CJS entrypoints are generated from the same TypeScript source.

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [Event-Driven Molecules](#event-driven-molecules)
- [API Overview](#api-overview)
- [Testing](#testing)
- [Handling Scope Cleanup Errors](#handling-scope-cleanup-errors)
- [Development](#development)
- [License](#license)

## Install

```bash
npm install @sigrea/use @sigrea/core
```

`@sigrea/core` is a peer dependency.

Requires Node.js 24 or later.

## Quick Start

```ts
import { useCounter, useEventListener, useMediaQuery } from "@sigrea/use";

const counter = useCounter(0, { min: 0 });
const isWide = useMediaQuery("(min-width: 768px)");

const resize = useEventListener("resize", () => {
  if (isWide.matches.value) {
    counter.inc();
  }
});

// Later, when this listener is no longer needed:
resize.stop();
```

See the exported utility groups below and the
[function docs](https://github.com/sigrea/use/tree/main/packages/use) for
function-specific behavior.

## Event-Driven Molecules

Use `createEvents` when a molecule needs to send typed events to a parent or
controller molecule. For controlled values, use `update:*` event names such as
`update:open`, `update:value`, or `update:selectedValue`; the event segment
matches the controlled prop, while local boolean state can use names such as
`isOpen`.

`send()` resolves after registered listeners finish. Listeners registered in a
Sigrea scope are removed when that scope is disposed, including listeners
registered during molecule setup.

See
[createEvents](https://github.com/sigrea/use/blob/main/packages/use/createEvents/index.md)
for the full pattern.

## API Overview

`@sigrea/use` exports utilities for common browser and reactivity work:

- **State and signals:** counters, toggles, async state, memoization, and signal transforms.
- **Watchers and timing:** debounced, throttled, pausable, ignorable, one-shot, and triggerable watchers.
- **Browser APIs:** media queries, storage, events, clipboard, network, sensors, observers, workers, and page state.
- **Collections and math:** array helpers, projections, clamping, precision, averages, sums, and numeric transforms.

All utilities are exported from the root package entrypoint.

## Testing

Most utilities can be tested as plain TypeScript functions with Vitest. For
browser APIs, use JSDOM-compatible fakes and stop returned handles in the test
that created them.

## Handling Scope Cleanup Errors

For global error handling configuration, see [@sigrea/core - Handling Scope Cleanup Errors](https://github.com/sigrea/core#handling-scope-cleanup-errors).

When a utility registers cleanup through a Sigrea scope, cleanup errors are
reported through the core handler. Configure the handler once in the application
entry point or test setup before creating scoped utilities.

## Development

This repo targets Node.js 24 or later.

If you use mise:

- `mise trust -y` — trust `mise.toml` (first run only).
- `pnpm -s cicheck` — run CI-equivalent checks locally.
- `mise run notes` — preview release notes (optional).

You can also run pnpm scripts directly:

- `pnpm install` — install dependencies.
- `pnpm test` — run the Vitest suite once (no watch).
- `pnpm typecheck` — run TypeScript type checking.
- `pnpm test:coverage` — collect coverage.
- `pnpm build` — compile via unbuild to produce dual CJS/ESM bundles.
- `pnpm -s cicheck` — run CI checks locally.

See
[CONTRIBUTING.md](https://github.com/sigrea/use/blob/main/CONTRIBUTING.md)
for workflow details.

## License

MIT. See [LICENSE](./LICENSE).
