import { resolveValue } from "../../shared/resolveValue";
import { bindTimerCleanup } from "../internal";

import type { MaybeValue, UseThrottleFnReturn } from "../types";

interface PendingCall<TThis, TArgs extends unknown[], TReturn> {
	thisArg: TThis;
	args: TArgs;
	resolve(value: Awaited<TReturn> | undefined): void;
	reject(reason?: unknown): void;
}

function settleCanceled<TThis, TArgs extends unknown[], TReturn>(
	call: PendingCall<TThis, TArgs, TReturn> | undefined,
	rejectOnCancel: boolean,
): void {
	if (call === undefined) {
		return;
	}

	if (rejectOnCancel) {
		call.reject();
		return;
	}

	call.resolve(undefined as Awaited<TReturn>);
}

export function useThrottleFn<TThis, TArgs extends unknown[], TReturn>(
	fn: (this: TThis, ...args: TArgs) => TReturn,
	ms: MaybeValue<number> = 200,
	trailing = false,
	leading = true,
	rejectOnCancel = false,
): UseThrottleFnReturn<(this: TThis, ...args: TArgs) => TReturn> {
	let lastExec = 0;
	let hasWindow = false;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pending: PendingCall<TThis, TArgs, TReturn> | undefined;
	let lastResult: Promise<Awaited<TReturn>> | undefined;

	const clearTimer = () => {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
	};

	const cancelPending = () => {
		clearTimer();
		settleCanceled(pending, rejectOnCancel);
		pending = undefined;
	};

	const invoke = (call: PendingCall<TThis, TArgs, TReturn>) => {
		hasWindow = true;
		lastExec = Date.now();
		try {
			lastResult = Promise.resolve(fn.apply(call.thisArg, call.args));
		} catch (error) {
			lastResult = Promise.reject(error);
		}
		lastResult.then(call.resolve, call.reject);
	};

	const scheduleTrailing = (
		call: PendingCall<TThis, TArgs, TReturn>,
		wait: number,
	) => {
		cancelPending();
		pending = call;
		timer = setTimeout(
			() => {
				const current = pending;
				pending = undefined;
				timer = undefined;
				if (current !== undefined) {
					invoke(current);
				}
			},
			Math.max(0, wait),
		);
	};

	function throttled(this: TThis, ...args: TArgs) {
		const duration = resolveValue(ms);

		return new Promise<Awaited<TReturn> | undefined>((resolve, reject) => {
			const call: PendingCall<TThis, TArgs, TReturn> = {
				args,
				reject,
				resolve,
				thisArg: this,
			};

			if (duration <= 0) {
				cancelPending();
				invoke(call);
				return;
			}

			const now = Date.now();
			const elapsed = hasWindow ? now - lastExec : duration;

			if (elapsed >= duration) {
				cancelPending();
				if (leading) {
					invoke(call);
					return;
				}

				hasWindow = true;
				lastExec = now;
				if (trailing) {
					scheduleTrailing(call, duration);
				} else {
					call.resolve(undefined as Awaited<TReturn>);
				}
				return;
			}

			if (trailing) {
				scheduleTrailing(call, duration - elapsed);
				return;
			}

			if (lastResult !== undefined) {
				lastResult.then(resolve, reject);
				return;
			}

			resolve(undefined as Awaited<TReturn>);
		});
	}

	bindTimerCleanup(cancelPending);

	return throttled as UseThrottleFnReturn<
		(this: TThis, ...args: TArgs) => TReturn
	>;
}
