---
category: Browser
---

# useGamepad

Reactive snapshots for the Gamepad API.

## Usage

```ts
import { useGamepad } from "@sigrea/use";

const gamepad = useGamepad();

gamepad.onConnected((index) => {
	console.log(`Gamepad ${index} connected`);
});

gamepad.onDisconnected((index) => {
	console.log(`Gamepad ${index} disconnected`);
});
```

`gamepads` is a readonly signal of cloned snapshots. Axes and button values are
sampled with `requestAnimationFrame` while polling is active.

## Controls

```ts
const gamepad = useGamepad();

gamepad.pause();
gamepad.resume();
gamepad.stop();
```

`pause()` stops polling but keeps event listeners. `stop()` cancels polling,
removes listeners, and clears event hooks.

Pass `navigator: null` or `window: null` to avoid falling back to globals in
server-side environments.
