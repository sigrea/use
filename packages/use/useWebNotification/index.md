# useWebNotification

Reactive Web Notifications API controls.

```ts
import { useWebNotification } from "@sigrea/use";

const {
	isSupported,
	permissionGranted,
	error,
	ensurePermissions,
	show,
	close,
	onClick,
	onShow,
	onError,
	onClose,
} = useWebNotification({
	title: "Build finished",
	body: "The deployment is ready.",
});

await ensurePermissions();

if (isSupported.value && permissionGranted.value) {
	await show();
}

onClick((event) => {
	console.log(event);
});

onShow((event) => {
	console.log(event);
});

onError((event) => {
	console.log(event);
});

onClose((event) => {
	console.log(event);
});

if (error.value !== null) {
	console.error(error.value);
}

close();
```

`show()` does not request permission. Call `ensurePermissions()` from a user
gesture first, then call `show()` after `permissionGranted.value` becomes true.

When the page becomes visible again, the current notification is closed because
the user can read the page directly.
