import { computed, readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, listen, resolveTarget } from "../../shared";
import type {
	BrowserLocationLike,
	BrowserLocationTrigger,
	BrowserLocationWindowLike,
	BrowserLocationWritableProperty,
	MaybeTarget,
	UseBrowserLocationOptions,
	UseBrowserLocationReturn,
} from "../types";

const writableProperties = [
	"hash",
	"host",
	"hostname",
	"href",
	"pathname",
	"port",
	"protocol",
	"search",
] as const satisfies readonly BrowserLocationWritableProperty[];

/**
 * Reactive browser location.
 */
export function useBrowserLocation<
	TWindow extends BrowserLocationWindowLike = BrowserLocationWindowLike,
>(options: UseBrowserLocationOptions<TWindow> = {}): UseBrowserLocationReturn {
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const trigger = signal<BrowserLocationTrigger>("load");
	const state = signal<unknown | undefined>(undefined);
	const length = signal<number | undefined>(undefined);
	const origin = signal<string | undefined>(undefined);
	const values = Object.fromEntries(
		writableProperties.map((key) => [key, signal<string | undefined>()]),
	) as Record<
		BrowserLocationWritableProperty,
		ReturnType<typeof signal<string | undefined>>
	>;

	const syncLocation = (
		nextTrigger: BrowserLocationTrigger,
		window = currentWindow(),
	) => {
		const location = window?.location;
		const history = window?.history;

		trigger.value = nextTrigger;
		state.value = history?.state;
		length.value = history?.length;
		origin.value = location?.origin;

		for (const key of writableProperties) {
			values[key].value = location?.[key];
		}
	};
	const writeLocationProperty = (
		location: BrowserLocationLike | undefined,
		key: BrowserLocationWritableProperty,
		value: string | undefined,
	) => {
		values[key].value = value;
		if (
			location === undefined ||
			value === undefined ||
			location[key] === value
		) {
			return;
		}

		location[key] = value;
		values[key].value = location[key];
	};
	const createLocationProperty = (key: BrowserLocationWritableProperty) =>
		computed({
			get: () => values[key].value,
			set: (value: string | undefined) => {
				writeLocationProperty(currentWindow()?.location, key, value);
			},
		});
	const stopWatch = watch(
		() => currentWindow(),
		(window, _previousWindow, onCleanup) => {
			syncLocation("load", window);

			if (window === undefined || window === null) {
				return;
			}

			const syncPopstate = () => {
				syncLocation("popstate", window);
			};
			const syncHashchange = () => {
				syncLocation("hashchange", window);
			};
			const cleanups = [
				listen(window, "popstate", syncPopstate, { passive: true }),
				listen(window, "hashchange", syncHashchange, { passive: true }),
			];

			onCleanup(() => {
				for (const cleanup of cleanups) {
					cleanup();
				}
			});
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		trigger: readonly(trigger),
		state: readonly(state),
		length: readonly(length),
		origin: readonly(origin),
		hash: createLocationProperty("hash"),
		host: createLocationProperty("host"),
		hostname: createLocationProperty("hostname"),
		href: createLocationProperty("href"),
		pathname: createLocationProperty("pathname"),
		port: createLocationProperty("port"),
		protocol: createLocationProperty("protocol"),
		search: createLocationProperty("search"),
		stop: stopWatch,
	};
}
