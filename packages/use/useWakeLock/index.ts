import { computed, readonly, signal, watch } from "@sigrea/core";

import {
	defaultDocument,
	defaultNavigator,
	listen,
	resolveTarget,
	resolveValue,
} from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	MaybeValue,
	UseWakeLockDocumentLike,
	UseWakeLockNavigatorLike,
	UseWakeLockOptions,
	UseWakeLockReturn,
	UseWakeLockSentinelLike,
	WakeLockType,
} from "../types";
import { useDocumentVisibility } from "../useDocumentVisibility";

type SupportedWakeLockNavigator<TSentinel extends UseWakeLockSentinelLike> =
	UseWakeLockNavigatorLike<TSentinel> & {
		readonly wakeLock: {
			request(type: WakeLockType): Promise<TSentinel>;
		};
	};

function isWakeLockNavigator<TSentinel extends UseWakeLockSentinelLike>(
	navigator: UseWakeLockNavigatorLike<TSentinel> | null | undefined,
): navigator is SupportedWakeLockNavigator<TSentinel> {
	return typeof navigator?.wakeLock?.request === "function";
}

function isVisible(visibility: DocumentVisibilityState): boolean {
	return visibility === "visible";
}

/**
 * Reactive Screen Wake Lock API controls.
 */
export function useWakeLock<
	TSentinel extends UseWakeLockSentinelLike = WakeLockSentinel,
	TNavigator extends
		UseWakeLockNavigatorLike<TSentinel> = UseWakeLockNavigatorLike<TSentinel>,
	TDocument extends UseWakeLockDocumentLike = UseWakeLockDocumentLike,
>(
	options: UseWakeLockOptions<TSentinel, TNavigator, TDocument> = {},
): UseWakeLockReturn<TSentinel> {
	const navigatorTarget: MaybeValue<TNavigator | null | undefined> =
		"navigator" in options
			? options.navigator
			: (defaultNavigator as TNavigator | undefined);
	const documentTarget: MaybeTarget<TDocument | null | undefined> =
		"document" in options
			? options.document
			: (defaultDocument as TDocument | undefined);
	const sentinel = signal<TSentinel | null>(null);
	const isSupported = signal(false);
	const requestedType = signal<WakeLockType | null>(null);
	const currentNavigator = () => resolveValue(navigatorTarget);
	const currentDocument = () => resolveTarget(documentTarget);
	const documentVisibility = useDocumentVisibility({
		document: documentTarget,
	});
	const currentVisibility = () =>
		currentDocument()?.visibilityState ?? documentVisibility.visibility.value;
	const isActive = computed(
		() =>
			sentinel.value !== null &&
			!sentinel.value.released &&
			isVisible(currentVisibility()),
	);
	let stopReleaseListener = () => {};
	let requestVersion = 0;
	let activeRequestType: WakeLockType | null = null;
	let stopped = false;

	const syncSupport = (navigator: TNavigator | null | undefined) => {
		isSupported.value = isWakeLockNavigator(navigator);
	};
	const clearReleaseListener = () => {
		stopReleaseListener();
		stopReleaseListener = () => {};
	};
	const clearSentinel = () => {
		clearReleaseListener();
		sentinel.value = null;
	};
	const runQueuedRequest = () => {
		if (!isVisible(currentVisibility())) {
			return;
		}

		const type = requestedType.value;
		if (type === null) {
			return;
		}

		const navigator = currentNavigator();
		syncSupport(navigator);
		if (!isWakeLockNavigator(navigator)) {
			return;
		}

		requestedType.value = null;
		void forceRequest(type).catch(() => {});
	};
	const releaseCurrent = async () => {
		const currentSentinel = sentinel.value;
		clearSentinel();
		if (currentSentinel !== null && !currentSentinel.released) {
			await currentSentinel.release();
		}
	};
	const setSentinel = (nextSentinel: TSentinel) => {
		clearSentinel();
		sentinel.value = nextSentinel;
		stopReleaseListener = listen(
			nextSentinel,
			"release",
			() => {
				if (sentinel.value !== nextSentinel) {
					return;
				}

				clearSentinel();
				if (stopped) {
					return;
				}

				if (!isVisible(currentVisibility())) {
					requestedType.value = nextSentinel.type;
				}
				runQueuedRequest();
			},
			{ passive: true },
		);
	};

	async function forceRequest(type: WakeLockType = "screen"): Promise<void> {
		if (stopped) {
			return;
		}

		requestVersion += 1;
		const requestId = requestVersion;
		activeRequestType = type;
		requestedType.value = null;
		try {
			await releaseCurrent();
			if (stopped || requestId !== requestVersion) {
				return;
			}

			const navigator = currentNavigator();
			syncSupport(navigator);
			if (!isWakeLockNavigator(navigator)) {
				return;
			}

			const nextSentinel = await navigator.wakeLock.request(type);

			if (
				stopped ||
				requestId !== requestVersion ||
				currentNavigator() !== navigator
			) {
				if (!nextSentinel.released) {
					await nextSentinel.release();
				}
				return;
			}

			setSentinel(nextSentinel);
		} finally {
			if (requestId === requestVersion) {
				activeRequestType = null;
			}
		}
	}

	async function request(type: WakeLockType = "screen"): Promise<void> {
		if (stopped) {
			return;
		}

		if (isVisible(currentVisibility())) {
			await forceRequest(type);
			return;
		}

		requestedType.value = type;
	}

	async function release(): Promise<void> {
		requestVersion += 1;
		activeRequestType = null;
		requestedType.value = null;
		await releaseCurrent();
	}

	const stopNavigatorWatch = watch(
		currentNavigator,
		(navigator, previousNavigator) => {
			syncSupport(navigator);
			if (previousNavigator === undefined || navigator === previousNavigator) {
				return;
			}

			const type =
				sentinel.value?.type ?? requestedType.value ?? activeRequestType;
			requestVersion += 1;
			void releaseCurrent().then(() => {
				if (stopped || type === null) {
					return;
				}

				requestedType.value = type;
				runQueuedRequest();
			});
		},
		{ immediate: true, flush: "sync" },
	);
	const stopDocumentWatch = watch(
		() => ({
			document: currentDocument(),
			visibility: documentVisibility.visibility.value,
		}),
		runQueuedRequest,
		{ flush: "sync" },
	);
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		requestVersion += 1;
		activeRequestType = null;
		requestedType.value = null;
		stopNavigatorWatch();
		stopDocumentWatch();
		documentVisibility.stop();
		void releaseCurrent();
	};

	tryOnScopeDispose(stop);

	return {
		sentinel: readonly(sentinel),
		isSupported: readonly(isSupported),
		isActive,
		request,
		forceRequest,
		release,
		stop,
	};
}
