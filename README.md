# @sigrea/use

`@sigrea/use` provides framework-agnostic Sigrea utilities built on
[`@sigrea/core`](https://www.npmjs.com/package/@sigrea/core) signals and
scopes. It is intended for shared state, timing, watcher, and browser logic
that should not depend on Vue, React, or a template runtime.

- **Framework-agnostic utilities.** Use signal-powered helpers without binding
  to a UI framework.
- **Scope-aware cleanup.** Browser listeners, timers, workers, and observers
  can be cleaned up through Sigrea scopes.
- **SSR-safe imports.** Browser-dependent helpers avoid touching browser
  globals during module import.
- **Tree-shakable package.** ESM and CJS entrypoints are generated from the
  same TypeScript source.

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

[`@sigrea/core`](https://www.npmjs.com/package/@sigrea/core) is a peer
dependency.

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

See [createEvents][create-events] for the full pattern.

## API Overview

`@sigrea/use` exports utilities for common browser and reactivity work:

- **State and signals:** counters, toggles, async state, memoization, and
  signal transforms.
- **Watchers and timing:** debounced, throttled, pausable, ignorable, one-shot,
  and triggerable watchers.
- **Browser APIs:** media queries, storage, events, clipboard, network, sensors,
  observers, workers, and page state.
- **Collections and math:** array helpers, projections, clamping, precision,
  averages, sums, and numeric transforms.

All utilities are exported from the root package entrypoint.

## Testing

Most utilities can be tested as plain TypeScript functions with Vitest. For
browser APIs, use JSDOM-compatible fakes and stop returned handles in the test
that created them.

## Handling Scope Cleanup Errors

For global error handling configuration, see
[@sigrea/core - Handling Scope Cleanup Errors][core-cleanup-errors].

When a utility registers cleanup through a Sigrea scope, cleanup errors are
reported through the core handler. Configure the handler once in the application
entry point or test setup before creating scoped utilities.

## Development

This package supports Node.js 24 or later.

Install [Vite+](https://viteplus.dev/guide/), then run:

```sh
vp env install
vp install --frozen-lockfile
vp run cicheck
```

See [CONTRIBUTING.md](https://github.com/sigrea/use/blob/main/CONTRIBUTING.md)
for individual commands and the release workflow.

## License

MIT. See [LICENSE](./LICENSE).

[core-cleanup-errors]: https://github.com/sigrea/core#handling-scope-cleanup-errors
[create-events]: https://github.com/sigrea/use/tree/main/packages/use/createEvents
