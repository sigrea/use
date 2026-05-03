import { resolveValue } from "../../shared/resolveValue";
import { bindTimerCleanup } from "../internal";

import type {
	MaybeValue,
	UseDebounceFnOptions,
	UseDebounceFnReturn,
} from "../types";

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

export function useDebounceFn<TThis, TArgs extends unknown[], TReturn>(
	fn: (this: TThis, ...args: TArgs) => TReturn,
	ms: MaybeValue<number> = 200,
	options: UseDebounceFnOptions = {},
): UseDebounceFnReturn<(this: TThis, ...args: TArgs) => TReturn> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let maxTimer: ReturnType<typeof setTimeout> | undefined;
	let pending: PendingCall<TThis, TArgs, TReturn> | undefined;

	const clearTimer = () => {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
	};

	const clearMaxTimer = () => {
		if (maxTimer !== undefined) {
			clearTimeout(maxTimer);
			maxTimer = undefined;
		}
	};

	const cancelPending = () => {
		clearTimer();
		clearMaxTimer();
		settleCanceled(pending, options.rejectOnCancel ?? false);
		pending = undefined;
	};

	const invokePending = () => {
		const current = pending;
		if (current === undefined) {
			return;
		}

		pending = undefined;
		clearTimer();
		clearMaxTimer();

		try {
			Promise.resolve(fn.apply(current.thisArg, current.args)).then(
				current.resolve,
				current.reject,
			);
		} catch (error) {
			current.reject(error);
		}
	};

	function debounced(this: TThis, ...args: TArgs) {
		const duration = resolveValue(ms);
		const maxDuration =
			options.maxWait === undefined ? undefined : resolveValue(options.maxWait);

		clearTimer();
		settleCanceled(pending, options.rejectOnCancel ?? false);

		return new Promise<Awaited<TReturn> | undefined>((resolve, reject) => {
			pending = {
				args,
				reject,
				resolve,
				thisArg: this,
			};

			if (duration <= 0 || (maxDuration !== undefined && maxDuration <= 0)) {
				clearMaxTimer();
				invokePending();
				return;
			}

			if (maxDuration !== undefined && maxTimer === undefined) {
				maxTimer = setTimeout(invokePending, maxDuration);
			}

			timer = setTimeout(invokePending, duration);
		});
	}

	bindTimerCleanup(cancelPending);

	return debounced as UseDebounceFnReturn<
		(this: TThis, ...args: TArgs) => TReturn
	>;
}
