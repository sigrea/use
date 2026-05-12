import { computed, readonly, signal, watch } from "@sigrea/core";

import { defaultDocument, resolveTarget } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UsePointerLockDocumentLike,
	UsePointerLockElementLike,
	UsePointerLockOptions,
	UsePointerLockReturn,
	UsePointerLockRootLike,
} from "../types";
import { useEventListener } from "../useEventListener";

type PendingPointerLockActionInit =
	| {
			kind: "lock";
			document: UsePointerLockDocumentLike;
			target: UsePointerLockElementLike;
			rejectOnErrorEvent: boolean;
			unadjustedMovement: boolean;
	  }
	| {
			kind: "unlock";
	  };

type PendingPointerLockAction =
	| {
			kind: "lock";
			id: number;
			promise: Promise<void>;
			document: UsePointerLockDocumentLike;
			rejectOnErrorEvent: boolean;
			target: UsePointerLockElementLike;
			unadjustedMovement: boolean;
			resolve(): void;
			reject(error: Error): void;
	  }
	| {
			kind: "unlock";
			id: number;
			promise: Promise<void>;
			resolve(): void;
			reject(error: Error): void;
	  };

function isFunction(value: unknown): value is (...args: never[]) => unknown {
	return typeof value === "function";
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as { then?: unknown }).then === "function"
	);
}

function isPointerLockRoot(value: unknown): value is UsePointerLockRootLike {
	return (
		typeof value === "object" && value !== null && "pointerLockElement" in value
	);
}

function isPointerLockDocument(
	document: UsePointerLockDocumentLike | null | undefined,
): document is UsePointerLockDocumentLike & {
	exitPointerLock(): Promise<void> | void;
} {
	return (
		document !== undefined &&
		document !== null &&
		"pointerLockElement" in document &&
		isFunction(document.exitPointerLock)
	);
}

function isPointerLockElement(
	target: UsePointerLockElementLike | null | undefined,
): target is UsePointerLockElementLike & {
	requestPointerLock(options?: PointerLockOptions): Promise<void> | void;
} {
	return isFunction(target?.requestPointerLock);
}

function toError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error));
}

function normalizeLockOptions(
	options: PointerLockOptions | undefined,
): boolean {
	return options?.unadjustedMovement ?? false;
}

function readPointerLockElement(
	document: UsePointerLockDocumentLike | null | undefined,
	target: UsePointerLockElementLike | null | undefined,
): UsePointerLockElementLike | null {
	if (target === undefined || target === null) {
		return null;
	}

	const root = target?.getRootNode?.();
	if (isPointerLockRoot(root) && root.pointerLockElement !== undefined) {
		return root.pointerLockElement;
	}

	return document?.pointerLockElement ?? null;
}

async function awaitMaybeThenable(value: unknown): Promise<void> {
	if (isThenable(value)) {
		await value;
	}
}

function handled<T>(promise: Promise<T>): Promise<T> {
	promise.catch(() => {});
	return promise;
}

/**
 * Reactive Pointer Lock API controls.
 */
export function usePointerLock<
	TElement extends UsePointerLockElementLike = UsePointerLockElementLike,
	TDocument extends UsePointerLockDocumentLike = UsePointerLockDocumentLike,
>(
	target?: MaybeTarget<TElement | null | undefined>,
	options: UsePointerLockOptions<TDocument> = {},
): UsePointerLockReturn<TElement> {
	const documentTarget =
		"document" in options && options.document !== undefined
			? options.document
			: (defaultDocument as MaybeTarget<TDocument> | undefined);
	const autoUnlock = options.autoUnlock ?? false;
	const element = signal<TElement | UsePointerLockElementLike | null>(null);
	let pendingAction: PendingPointerLockAction | undefined;
	let lastLockedElement: UsePointerLockElementLike | null = null;
	let lastLockedDocument: UsePointerLockDocumentLike | null = null;
	let lastLockTarget: UsePointerLockElementLike | null = null;
	let lastLockUnadjustedMovement: boolean | undefined;
	let actionId = 0;

	const currentDocument = (): TDocument | undefined =>
		documentTarget === undefined
			? undefined
			: resolveTarget<TDocument>(documentTarget);
	const currentTarget = (
		document: TDocument | undefined = currentDocument(),
	): TElement | UsePointerLockElementLike | undefined => {
		if (target === undefined) {
			return document?.documentElement ?? undefined;
		}

		return resolveTarget<TElement>(target);
	};
	const documentForLockedTarget = (
		lockTarget: UsePointerLockElementLike | null | undefined,
	): UsePointerLockDocumentLike | null | undefined => {
		if (
			lockTarget !== undefined &&
			lockTarget !== null &&
			isPointerLockDocument(lastLockedDocument) &&
			readPointerLockElement(lastLockedDocument, lockTarget) === lockTarget
		) {
			return lastLockedDocument;
		}

		const document = currentDocument();
		if (
			lockTarget !== undefined &&
			lockTarget !== null &&
			isPointerLockDocument(document) &&
			readPointerLockElement(document, lockTarget) === lockTarget
		) {
			return document;
		}

		return document ?? lastLockedDocument;
	};
	const syncPointerLock = (
		lockTarget: UsePointerLockElementLike | null | undefined = currentTarget(
			currentDocument(),
		),
		sourceDocument:
			| UsePointerLockDocumentLike
			| null
			| undefined = currentDocument(),
	) => {
		const document = sourceDocument;
		const lockedElement = readPointerLockElement(document, lockTarget);
		element.value = lockedElement;
		if (lockedElement !== null) {
			lastLockedElement = lockedElement;
			lastLockedDocument = document ?? null;
			return;
		}
		if (lastLockedElement !== null) {
			const lastDocumentLock = readPointerLockElement(
				lastLockedDocument,
				lastLockedElement,
			);
			const currentDocumentLock =
				document === undefined
					? null
					: readPointerLockElement(document, lastLockedElement);
			lastLockedElement = currentDocumentLock ?? lastDocumentLock;
			if (lastLockedElement === null) {
				lastLockedDocument = null;
			}
		}
	};
	const isSupported = computed(() => {
		const document = currentDocument();
		const target = currentTarget(document);

		return isPointerLockDocument(document) && isPointerLockElement(target);
	});
	const isLocked = computed(() => element.value !== null);
	const hasCurrentLockOptions = (
		target: UsePointerLockElementLike,
		lockOptions: PointerLockOptions | undefined,
	): boolean =>
		lastLockTarget === target &&
		lastLockUnadjustedMovement === normalizeLockOptions(lockOptions);
	const isSameLockRequest = (
		action: PendingPointerLockAction,
		target: UsePointerLockElementLike,
		lockOptions: PointerLockOptions | undefined,
	): boolean =>
		action.kind === "lock" &&
		action.target === target &&
		action.unadjustedMovement === normalizeLockOptions(lockOptions);
	const settlePendingAction = () => {
		if (pendingAction === undefined) {
			return;
		}

		if (
			pendingAction.kind === "lock" &&
			element.value === pendingAction.target
		) {
			const action = pendingAction;
			pendingAction = undefined;
			action.resolve();
			return;
		}

		if (pendingAction.kind === "unlock" && element.value === null) {
			const action = pendingAction;
			pendingAction = undefined;
			action.resolve();
		}
	};
	const rejectPendingAction = (error: Error) => {
		if (pendingAction === undefined) {
			return;
		}

		const action = pendingAction;
		pendingAction = undefined;
		action.reject(error);
	};
	const rejectPendingLockAction = (id: number, error: unknown) => {
		const action: PendingPointerLockAction | undefined = pendingAction;
		if (action?.kind !== "lock" || action.id !== id) {
			return;
		}

		action.reject(toError(error));
		pendingAction = undefined;
	};
	const setPendingLockErrorEventHandling = (
		id: number,
		rejectOnErrorEvent: boolean,
	) => {
		const action: PendingPointerLockAction | undefined = pendingAction;
		if (action?.kind !== "lock" || action.id !== id) {
			return;
		}

		action.rejectOnErrorEvent = rejectOnErrorEvent;
	};
	const rejectPendingUnlockAction = (id: number, error: unknown) => {
		const action: PendingPointerLockAction | undefined = pendingAction;
		if (action?.kind !== "unlock" || action.id !== id) {
			return;
		}

		action.reject(toError(error));
		pendingAction = undefined;
	};
	const rememberLockOptions = (
		target: UsePointerLockElementLike,
		lockOptions: PointerLockOptions | undefined,
	) => {
		lastLockTarget = target;
		lastLockUnadjustedMovement = normalizeLockOptions(lockOptions);
	};
	const forgetLockOptions = () => {
		lastLockTarget = null;
		lastLockUnadjustedMovement = undefined;
	};
	const startPendingAction = (
		action: PendingPointerLockActionInit,
	): { id: number; promise: Promise<void> } => {
		rejectPendingAction(new Error("Pointer lock action was replaced."));
		actionId += 1;
		const id = actionId;
		let resolveAction!: () => void;
		let rejectAction!: (error: Error) => void;

		const promise = new Promise<void>((resolve, reject) => {
			resolveAction = resolve;
			rejectAction = reject;
		});
		pendingAction = {
			...action,
			id,
			promise,
			resolve: resolveAction,
			reject: rejectAction,
		} as PendingPointerLockAction;

		return { id, promise };
	};
	const syncForPointerLockEvent = () => {
		const action = pendingAction;
		if (action?.kind === "lock") {
			syncPointerLock(action.target, action.document);
			return;
		}

		syncPointerLock();
	};
	const waitForPendingLockFailure = async (
		promise: Promise<void>,
	): Promise<boolean> => {
		try {
			await promise;
		} catch {
			return true;
		}

		return false;
	};
	const ignorePendingAction = async (): Promise<boolean> => {
		if (pendingAction === undefined) {
			return false;
		}

		try {
			await pendingAction.promise;
		} catch {
			// The in-flight request already owns the rejection.
		}

		return true;
	};
	const listenerOptions = { passive: true };
	const syncLater = (
		lockTarget: UsePointerLockElementLike | null | undefined = currentTarget(),
	) => {
		setTimeout(() => {
			syncPointerLock(lockTarget);
		}, 0);
	};
	let autoUnlockExitPending = false;
	let stopLateExitSyncWatch: (() => void) | undefined;
	const watchLateExitSync = (
		lockTarget: UsePointerLockElementLike | null | undefined,
		document: UsePointerLockDocumentLike,
		onUnlocked?: () => void,
		onError?: () => void,
	) => {
		stopLateExitSyncWatch?.();
		const syncExit = (): boolean => {
			const lockedElement = readPointerLockElement(document, lockTarget);
			element.value = lockedElement;
			if (lockedElement !== null) {
				lastLockedElement = lockedElement;
				lastLockedDocument = document;
				return false;
			}
			if (lastLockedDocument === document) {
				lastLockedElement = null;
				lastLockedDocument = null;
			}
			onUnlocked?.();
			return true;
		};

		if (syncExit()) {
			return;
		}

		const cleanup = () => {
			document.removeEventListener(
				"pointerlockchange",
				onPointerLockChange,
				false,
			);
			document.removeEventListener(
				"pointerlockerror",
				onPointerLockError,
				false,
			);
			clearTimeout(timeout);
			if (stopLateExitSyncWatch === cleanup) {
				stopLateExitSyncWatch = undefined;
			}
		};
		const onPointerLockChange = () => {
			if (syncExit()) {
				cleanup();
			}
		};
		const onPointerLockError = () => {
			onError?.();
			cleanup();
		};
		const timeout = setTimeout(cleanup, 30_000);

		document.addEventListener(
			"pointerlockchange",
			onPointerLockChange,
			listenerOptions,
		);
		document.addEventListener(
			"pointerlockerror",
			onPointerLockError,
			listenerOptions,
		);
		stopLateExitSyncWatch = cleanup;
	};
	const autoUnlockPointerLock = (
		lockTarget: UsePointerLockElementLike | null | undefined = currentTarget(),
		expectedTarget?: UsePointerLockElementLike,
		sourceDocument?: UsePointerLockDocumentLike | null,
	): boolean => {
		if (autoUnlockExitPending) {
			return true;
		}

		const document = sourceDocument ?? documentForLockedTarget(lockTarget);
		if (!isPointerLockDocument(document)) {
			return false;
		}

		const lockedElement = readPointerLockElement(document, lockTarget);
		element.value = lockedElement;
		if (lockedElement === null) {
			return false;
		}
		lastLockedElement = lockedElement;
		lastLockedDocument = document;
		if (expectedTarget !== undefined && lockedElement !== expectedTarget) {
			return false;
		}

		autoUnlockExitPending = true;
		const exitResult = document.exitPointerLock();
		if (!isThenable(exitResult)) {
			watchLateExitSync(lockTarget, document);
		}
		const lockedAfterExit = readPointerLockElement(document, lockTarget);
		element.value = lockedAfterExit;
		if (lockedAfterExit === null && lastLockedDocument === document) {
			lastLockedElement = null;
			lastLockedDocument = null;
		}
		syncLater(lockTarget);
		void awaitMaybeThenable(exitResult)
			.catch(() => {})
			.finally(() => {
				autoUnlockExitPending = false;
				const lockedElement = readPointerLockElement(document, lockTarget);
				element.value = lockedElement;
				if (lockedElement === null && lastLockedDocument === document) {
					lastLockedElement = null;
					lastLockedDocument = null;
				}
				syncLater(lockTarget);
			});

		return true;
	};
	let stopLateAutoUnlockWatch: (() => void) | undefined;
	const watchLateAutoUnlock = (
		lockTarget: UsePointerLockElementLike,
		sourceDocument?: UsePointerLockDocumentLike | null,
	) => {
		const document = sourceDocument ?? currentDocument();
		if (!isPointerLockDocument(document)) {
			return;
		}

		stopLateAutoUnlockWatch?.();
		const cleanup = () => {
			document.removeEventListener(
				"pointerlockchange",
				onPointerLockChange,
				false,
			);
			document.removeEventListener(
				"pointerlockerror",
				onPointerLockError,
				false,
			);
			clearTimeout(timeout);
			if (stopLateAutoUnlockWatch === cleanup) {
				stopLateAutoUnlockWatch = undefined;
			}
		};
		const onPointerLockChange = () => {
			syncPointerLock(lockTarget, document);
			if (element.value === lockTarget) {
				autoUnlockPointerLock(lockTarget, lockTarget, document);
				return;
			}
			if (element.value === null) {
				cleanup();
			}
		};
		const onPointerLockError = () => {
			cleanup();
		};
		const timeout = setTimeout(cleanup, 30_000);

		document.addEventListener(
			"pointerlockchange",
			onPointerLockChange,
			listenerOptions,
		);
		document.addEventListener(
			"pointerlockerror",
			onPointerLockError,
			listenerOptions,
		);
		stopLateAutoUnlockWatch = cleanup;
	};
	const watchPendingLock = (
		id: number,
		document: UsePointerLockDocumentLike,
		lockTarget: UsePointerLockElementLike,
	) => {
		const cleanup = () => {
			document.removeEventListener(
				"pointerlockchange",
				onPointerLockChange,
				false,
			);
			document.removeEventListener(
				"pointerlockerror",
				onPointerLockError,
				false,
			);
		};
		const onPointerLockChange = () => {
			const action = pendingAction;
			if (action?.kind !== "lock" || action.id !== id) {
				cleanup();
				return;
			}

			syncPointerLock(lockTarget, document);
			settlePendingAction();
			if (pendingAction !== action) {
				cleanup();
			}
		};
		const onPointerLockError = () => {
			const action = pendingAction;
			if (action?.kind === "lock" && action.id === id) {
				rejectPendingLockAction(
					id,
					new Error("Failed to change pointer lock state."),
				);
			}
			cleanup();
		};

		document.addEventListener(
			"pointerlockchange",
			onPointerLockChange,
			listenerOptions,
		);
		document.addEventListener(
			"pointerlockerror",
			onPointerLockError,
			listenerOptions,
		);
	};
	const documentListener = useEventListener(
		() => currentDocument() as EventTarget | undefined,
		"pointerlockchange",
		() => {
			syncForPointerLockEvent();
			settlePendingAction();
		},
		listenerOptions,
	);
	const documentErrorListener = useEventListener(
		() => currentDocument() as EventTarget | undefined,
		"pointerlockerror",
		() => {
			syncForPointerLockEvent();
			if (
				pendingAction?.kind === "lock" &&
				pendingAction.rejectOnErrorEvent === false
			) {
				return;
			}

			rejectPendingAction(new Error("Failed to change pointer lock state."));
		},
		listenerOptions,
	);
	const stopSync = watch(
		() => ({
			document: currentDocument(),
			target: currentTarget(),
		}),
		() => {
			syncPointerLock();
			settlePendingAction();
		},
		{ immediate: true, flush: "sync" },
	);

	const lock = async (lockOptions?: PointerLockOptions): Promise<void> => {
		while (true) {
			const action = pendingAction;
			if (action !== undefined) {
				try {
					await action.promise;
					const document = currentDocument();
					const target = currentTarget(document);
					if (
						action.kind === "lock" &&
						isPointerLockDocument(document) &&
						isPointerLockElement(target) &&
						readPointerLockElement(document, target) === target &&
						isSameLockRequest(action, target, lockOptions)
					) {
						return;
					}
				} catch (error) {
					const document = currentDocument();
					const target = currentTarget(document);
					if (
						!isPointerLockDocument(document) ||
						!isPointerLockElement(target)
					) {
						syncPointerLock();
						return;
					}
					if (
						action.kind !== "lock" ||
						isSameLockRequest(action, target, lockOptions)
					) {
						throw error;
					}
				}
			}

			if (pendingAction !== undefined && pendingAction !== action) {
				continue;
			}

			break;
		}

		const document = currentDocument();
		const target = currentTarget(document);
		if (!isPointerLockDocument(document) || !isPointerLockElement(target)) {
			syncPointerLock();
			return;
		}

		if (
			readPointerLockElement(document, target) === target &&
			hasCurrentLockOptions(target, lockOptions)
		) {
			syncPointerLock();
			return;
		}

		if (pendingAction !== undefined) {
			await lock(lockOptions);
			return;
		}

		const pendingLock = startPendingAction({
			kind: "lock",
			document,
			target,
			rejectOnErrorEvent: true,
			unadjustedMovement: normalizeLockOptions(lockOptions),
		});
		const pendingLockFailure = waitForPendingLockFailure(pendingLock.promise);
		const lockPromise = handled(pendingLock.promise);
		try {
			const requestResult = target.requestPointerLock(lockOptions);
			setPendingLockErrorEventHandling(
				pendingLock.id,
				!isThenable(requestResult),
			);
			await awaitMaybeThenable(requestResult);
			if (!isThenable(requestResult)) {
				watchPendingLock(pendingLock.id, document, target);
			}
			syncPointerLock(target, document);
			rememberLockOptions(target, lockOptions);
			if (stopped && autoUnlock) {
				autoUnlockPointerLock(target, target, document);
			}
			settlePendingAction();
			await lockPromise;
		} catch (error) {
			const wasStopped = stopped;
			rejectPendingLockAction(pendingLock.id, error);
			if (wasStopped && autoUnlock) {
				autoUnlockPointerLock();
			}
			throw error;
		}
		if ((await pendingLockFailure) && stopped && autoUnlock) {
			autoUnlockPointerLock();
		}
	};
	const unlock = async (): Promise<void> => {
		if (pendingAction !== undefined && (await ignorePendingAction())) {
			if (element.value === null && lastLockedElement === null) {
				return;
			}
		}

		const unlockTarget = element.value ?? lastLockedElement;
		const document = documentForLockedTarget(unlockTarget);
		const target = currentTarget(
			document === null ? undefined : (document as TDocument | undefined),
		);
		if (!isPointerLockDocument(document) || unlockTarget === null) {
			syncPointerLock();
			return;
		}

		const pendingUnlock = startPendingAction({ kind: "unlock" });
		const unlockPromise = handled(pendingUnlock.promise);
		try {
			const exitResult = document.exitPointerLock();
			if (!isThenable(exitResult)) {
				watchLateExitSync(unlockTarget, document, settlePendingAction, () => {
					rejectPendingUnlockAction(
						pendingUnlock.id,
						new Error("Failed to change pointer lock state."),
					);
				});
			}
			await awaitMaybeThenable(exitResult);
			syncPointerLock(unlockTarget, document);
			settlePendingAction();
			await unlockPromise;
			forgetLockOptions();
		} catch (error) {
			rejectPendingUnlockAction(pendingUnlock.id, error);
			throw error;
		}

		if (readPointerLockElement(document, target ?? unlockTarget) === null) {
			syncPointerLock(unlockTarget, document);
		}
	};
	const toggle = async (lockOptions?: PointerLockOptions): Promise<void> => {
		if (isLocked.value) {
			await unlock();
			return;
		}

		await lock(lockOptions);
	};

	let stopped = false;
	const stop = () => {
		if (stopped) {
			return;
		}

		const pendingLockTarget =
			pendingAction?.kind === "lock" ? pendingAction.target : undefined;
		const pendingLockDocument =
			pendingAction?.kind === "lock" ? pendingAction.document : undefined;
		const pendingLockNeedsEvent =
			pendingAction?.kind === "lock" && pendingAction.rejectOnErrorEvent;
		stopped = true;
		rejectPendingAction(new Error("Pointer lock controls were stopped."));

		if (!autoUnlock) {
			stopLateExitSyncWatch?.();
			stopLateAutoUnlockWatch?.();
		} else {
			const currentLockTarget = element.value ?? lastLockedElement;
			const currentUnlocked = autoUnlockPointerLock(
				currentLockTarget,
				currentLockTarget ?? undefined,
			);
			const pendingUnlocked =
				pendingLockTarget === undefined
					? true
					: autoUnlockPointerLock(
							pendingLockTarget,
							pendingLockTarget,
							pendingLockDocument,
						);
			if (
				pendingLockTarget !== undefined &&
				pendingLockNeedsEvent &&
				(!pendingUnlocked || currentUnlocked)
			) {
				watchLateAutoUnlock(pendingLockTarget, pendingLockDocument);
			}
		}

		stopSync();
		documentListener.stop();
		documentErrorListener.stop();
	};

	tryOnScopeDispose(stop);

	return {
		element: readonly(element),
		isLocked: readonly(isLocked),
		isSupported: readonly(isSupported),
		lock,
		unlock,
		toggle,
		stop,
	};
}
