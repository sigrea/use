import { getCurrentScope, onDispose, onMount, onUnmount } from "@sigrea/core";

const canAutoStartTimer = () => typeof window !== "undefined";

export function bindTimerCleanup(cleanup: () => void): void {
	const scope = getCurrentScope();
	if (scope !== undefined) {
		onDispose(cleanup, scope);
	}

	try {
		onUnmount(cleanup);
	} catch {}
}

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
			if (immediate && canAutoStartTimer()) {
				start();
			}
		});
		onUnmount(stop);
		return;
	} catch {}

	if (immediate && canAutoStartTimer()) {
		start();
	}
}
