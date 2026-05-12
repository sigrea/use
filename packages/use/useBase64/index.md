# useBase64

Reactive base64 conversion. It supports text, `Blob`, `ArrayBuffer`, canvas,
image, object, array, `Map`, and `Set` sources.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useBase64 } from "@sigrea/use";

const text = signal("hello");
const { base64, promise, execute } = useBase64(text);

await promise.value;
base64.value; // data:text/plain;base64,aGVsbG8=

text.value = "ready";
await execute();
```

## Raw Base64

Set `dataUrl: false` to remove the Data URL prefix.

```ts
const { base64, promise } = useBase64("hello", { dataUrl: false });

await promise.value;
base64.value; // aGVsbG8=
```

## Objects

Objects, arrays, `Map`, and `Set` values are serialized as JSON. Pass a
serializer when the default JSON output is not enough.

```ts
const payload = signal({ id: 1, name: "todo" });
const { base64 } = useBase64(payload, {
	serializer: (value) => JSON.stringify(value, null, 2),
});
```

## Canvas And Images

Canvas and image sources can specify a MIME type and quality.

```ts
const canvas = document.querySelector("canvas");
const { base64 } = useBase64(canvas, {
	type: "image/jpeg",
	quality: 0.8,
});
```
