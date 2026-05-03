import { computed, readonly } from "@sigrea/core";
import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import type {
	Breakpoints,
	MatchMediaWindow,
	MaybeTarget,
	MaybeValue,
	UseBreakpointsOptions,
	UseBreakpointsReturn,
	UseMediaQueryReturn,
	WindowLike,
} from "../types";
import { useMediaQuery } from "../useMediaQuery";

function formatWithUnit(value: number | string): string {
	return typeof value === "number" ? `${value}px` : value.trim();
}

function pxValue(value: number | string): number {
	if (typeof value === "number") {
		return value;
	}

	const trimmedValue = value.trim();
	const calcMatch = trimmedValue.match(
		/^calc\(\s*(.+?)\s*([+-])\s*(-?\d+(?:\.\d+)?)px\s*\)$/i,
	);
	if (calcMatch !== null) {
		const baseValue = pxValue(calcMatch[1]);
		const offsetValue = Number.parseFloat(calcMatch[3]);
		return calcMatch[2] === "+"
			? baseValue + offsetValue
			: baseValue - offsetValue;
	}

	const parsedValue = Number.parseFloat(trimmedValue);
	return trimmedValue.toLowerCase().endsWith("rem")
		? parsedValue * 16
		: parsedValue;
}

function offsetByPx(value: number | string, delta: number): string {
	const operator = delta < 0 ? "-" : "+";
	return `calc(${formatWithUnit(value)} ${operator} ${Math.abs(delta)}px)`;
}

export function useBreakpoints<
	K extends string,
	TWindow extends MatchMediaWindow = WindowLike & MatchMediaWindow,
>(
	breakpoints: Breakpoints<K>,
	options: UseBreakpointsOptions<TWindow> = {},
): UseBreakpointsReturn<K> {
	const strategy = options.strategy ?? "min-width";
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const breakpointKeys = Object.keys(breakpoints) as K[];

	const getValue = (key: MaybeValue<K>, delta?: number) => {
		const value = resolveValue(breakpoints[resolveValue(key)]);
		return delta === undefined
			? formatWithUnit(value)
			: offsetByPx(value, delta);
	};
	const readWidthMatch = (query: "min" | "max", size: string) => {
		const currentWindow =
			windowTarget === undefined
				? undefined
				: resolveTarget<TWindow>(windowTarget);
		if (currentWindow && typeof currentWindow.matchMedia === "function") {
			return currentWindow.matchMedia(`(${query}-width: ${size})`).matches;
		}
		if (typeof options.ssrWidth === "number") {
			return query === "min"
				? options.ssrWidth >= pxValue(size)
				: options.ssrWidth <= pxValue(size);
		}

		return options.initialValue ?? false;
	};
	const sortedBreakpointKeys = () =>
		[...breakpointKeys].sort((left, right) => {
			return pxValue(getValue(left)) - pxValue(getValue(right));
		});
	const greaterOrEqual = (key: MaybeValue<K>) =>
		useMediaQuery(() => `(min-width: ${getValue(key)})`, options);
	const smallerOrEqual = (key: MaybeValue<K>) =>
		useMediaQuery(() => `(max-width: ${getValue(key)})`, options);
	const shortcutHandles = {} as Record<K, UseMediaQueryReturn>;
	const shortcutMethods = {} as Record<K, UseMediaQueryReturn>;

	for (const key of breakpointKeys) {
		shortcutHandles[key] =
			strategy === "min-width" ? greaterOrEqual(key) : smallerOrEqual(key);
		Object.defineProperty(shortcutMethods, key, {
			configurable: true,
			enumerable: true,
			get: () => shortcutHandles[key],
		});
	}
	const current = () =>
		readonly(
			computed(() =>
				sortedBreakpointKeys().filter((key) => {
					return shortcutMethods[key].matches.value;
				}),
			),
		);
	const active = () => {
		const currentBreakpoints = current();

		return readonly(
			computed(() => {
				const matches = currentBreakpoints.value;
				if (matches.length === 0) {
					return "";
				}

				return strategy === "min-width"
					? matches[matches.length - 1]
					: matches[0];
			}),
		);
	};

	return Object.assign(shortcutMethods, {
		active,
		between(first: MaybeValue<K>, second: MaybeValue<K>) {
			return useMediaQuery(
				() =>
					`(min-width: ${getValue(first)}) and (max-width: ${getValue(
						second,
						-0.1,
					)})`,
				options,
			);
		},
		current,
		greater(key: MaybeValue<K>) {
			return useMediaQuery(() => `(min-width: ${getValue(key, 0.1)})`, options);
		},
		greaterOrEqual,
		isGreater(key: MaybeValue<K>) {
			return readWidthMatch("min", getValue(key, 0.1));
		},
		isGreaterOrEqual(key: MaybeValue<K>) {
			return readWidthMatch("min", getValue(key));
		},
		isInBetween(first: MaybeValue<K>, second: MaybeValue<K>) {
			return (
				readWidthMatch("min", getValue(first)) &&
				readWidthMatch("max", getValue(second, -0.1))
			);
		},
		isSmaller(key: MaybeValue<K>) {
			return readWidthMatch("max", getValue(key, -0.1));
		},
		isSmallerOrEqual(key: MaybeValue<K>) {
			return readWidthMatch("max", getValue(key));
		},
		smaller(key: MaybeValue<K>) {
			return useMediaQuery(
				() => `(max-width: ${getValue(key, -0.1)})`,
				options,
			);
		},
		smallerOrEqual,
		stop() {
			for (const handle of Object.values<UseMediaQueryReturn>(
				shortcutHandles,
			)) {
				handle.stop();
			}
		},
	}) as UseBreakpointsReturn<K>;
}
