# @sigrea/use

Composable utilities for
[@sigrea/core](https://github.com/sigrea/core).

`@sigrea/use` provides small, framework-agnostic helpers built with Sigrea
signals and molecule lifecycles.

## Features

- Works without Vue, React, or a template runtime
- Uses `@sigrea/core` signals for returned state
- Cleans up browser listeners and timers with Sigrea scopes and molecules
- Safe to import in SSR environments
- Tree-shakable ESM and CJS builds

## Install

```bash
npm install @sigrea/core @sigrea/use
```

`@sigrea/core` is a peer dependency.

Requires Node.js 20 or later.

## Usage

```ts
import { useCounter, useEventListener, useMediaQuery } from "@sigrea/use";

const counter = useCounter(0, { min: 0 });
counter.inc();

const isWide = useMediaQuery("(min-width: 768px)");

const resize = useEventListener("resize", () => {
	console.log(counter.count.value, isWide.matches.value);
});

resize.stop();
```

## License

MIT
