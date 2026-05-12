# useEventBus

Shared event bus keyed by a string, number, or typed symbol.

## Usage

```ts
import { useEventBus } from "@sigrea/use";

const bus = useEventBus<string>("news");

const { off } = bus.on((message) => {
	console.log(message);
});

await bus.emit("ready");
off();
```

Listeners registered inside a Sigrea scope are removed when that scope is
disposed. Listeners registered outside a scope must be removed with `off()` or
`reset()`.

## Multiple Arguments

Use a tuple type when an event carries more than one argument.

```ts
const counter = useEventBus<
	[event: "inc" | "dec", payload: { amount: number }]
>("counter");

counter.on((event, payload) => {
	console.log(event, payload.amount);
});

await counter.emit("inc", { amount: 1 });
```

## Once

Use `once()` when a listener should be removed after its first call.

```ts
const bus = useEventBus<void>("ready");

bus.once(() => {
	console.log("ready");
});

await bus.emit();
await bus.emit();
```

## Typed Keys

Use `EventBusKey` to bind event arguments to a symbol key.

```ts
import type { EventBusKey } from "@sigrea/use";

const userKey = Symbol("user") as EventBusKey<{ id: string }>;
const userBus = useEventBus(userKey);

await userBus.emit({ id: "u1" });
```

Event buses are stored in a module-level map. In a long-lived server process,
the same key shares listeners until they are removed.
