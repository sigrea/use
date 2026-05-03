---
category: Browser
---

# useBreakpoints

Reactive viewport breakpoints.

## Usage

```ts
import { useBreakpoints } from "@sigrea/use";

const breakpoints = useBreakpoints({
	sm: 640,
	md: 768,
	lg: "64rem",
});

console.log(breakpoints.md.matches.value);
console.log(breakpoints.active().value);
```

## Methods

```ts
import { useBreakpoints } from "@sigrea/use";

const breakpoints = useBreakpoints({
	sm: 640,
	md: 768,
	lg: 1024,
});

const medium = breakpoints.between("md", "lg");

console.log(medium.matches.value);
console.log(breakpoints.isGreaterOrEqual("md"));
console.log(breakpoints.current().value);

medium.stop();
breakpoints.stop();
```

## Options

```ts
import { useBreakpoints } from "@sigrea/use";

const breakpoints = useBreakpoints(
	{
		sm: 640,
		md: 768,
	},
	{
		ssrWidth: 768,
		strategy: "max-width",
	},
);

console.log(breakpoints.sm.matches.value);
```

With `strategy: "max-width"`, shortcut properties use `max-width` for the
breakpoint value.

Breakpoint values support `px` numbers and `rem` strings.
