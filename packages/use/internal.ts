import { getCurrentScope, onDispose, onMount, onUnmount } from "@sigrea/core";

export function bindAutoStart(
	start: () => void,
	stop: () => void,
	immediate: boolean,
): void {
	const scope = getCurrentScope();
	if (scope !== undefined) {
		onDispose(stop, scope);
	}

	// onMount() only succeeds during molecule setup, so this branches setup and plain usage.
	try {
		onMount(() => {
			if (immediate) {
				start();
			}
		});
		onUnmount(stop);
		return;
	} catch {}

	if (immediate) {
		start();
	}
}
