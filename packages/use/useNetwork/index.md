---
category: Sensors
---

# useNetwork

Reactive network status and Network Information API values.

## Usage

```ts
import { useNetwork } from "@sigrea/use";

const {
	isSupported,
	isOnline,
	offlineAt,
	onlineAt,
	downlink,
	effectiveType,
	type,
	stop,
} = useNetwork();

console.log(isSupported.value);
console.log(isOnline.value);
console.log(offlineAt.value);
console.log(onlineAt.value);
console.log(downlink.value);
console.log(effectiveType.value);
console.log(type.value);

stop();
```

The online state follows `navigator.onLine` and the window `online` / `offline`
events. Network information values come from `navigator.connection` when the
browser exposes the Network Information API.
