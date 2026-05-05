import { readonly, signal, watch } from "@sigrea/core";

import { defaultNavigator, listen, resolveValue } from "../../shared";
import type {
	BatteryManagerLike,
	BatteryNavigatorLike,
	MaybeValue,
	NavigatorLike,
	UseBatteryOptions,
	UseBatteryReturn,
} from "../types";

const batteryEvents = [
	"chargingchange",
	"chargingtimechange",
	"dischargingtimechange",
	"levelchange",
] as const;

function isBatteryNavigator(
	navigator: NavigatorLike | null | undefined,
): navigator is BatteryNavigatorLike {
	return (
		typeof (navigator as BatteryNavigatorLike | undefined)?.getBattery ===
		"function"
	);
}

function normalizeBatteryTime(value: number): number {
	return value || 0;
}

/**
 * Reactive Battery Status API.
 */
export function useBattery<
	TNavigator extends NavigatorLike = BatteryNavigatorLike,
>(options: UseBatteryOptions<TNavigator> = {}): UseBatteryReturn {
	const navigatorTarget: MaybeValue<TNavigator | null | undefined> =
		"navigator" in options
			? options.navigator
			: (defaultNavigator as TNavigator | undefined);
	const isSupported = signal(false);
	const charging = signal(false);
	const chargingTime = signal(0);
	const dischargingTime = signal(0);
	const level = signal(1);
	let executionCount = 0;

	const updateBatteryInfo = (battery: BatteryManagerLike) => {
		charging.value = battery.charging;
		chargingTime.value = normalizeBatteryTime(battery.chargingTime);
		dischargingTime.value = normalizeBatteryTime(battery.dischargingTime);
		level.value = battery.level;
	};
	const resetBatteryInfo = () => {
		charging.value = false;
		chargingTime.value = 0;
		dischargingTime.value = 0;
		level.value = 1;
	};

	const stop = watch(
		() => resolveValue(navigatorTarget),
		(currentNavigator, _previousNavigator, onCleanup) => {
			executionCount += 1;
			const executionId = executionCount;
			resetBatteryInfo();
			isSupported.value = isBatteryNavigator(currentNavigator);
			if (!isBatteryNavigator(currentNavigator)) {
				return;
			}

			let stopped = false;
			const cleanups: Array<() => void> = [];

			onCleanup(() => {
				stopped = true;
				for (const cleanup of cleanups) {
					cleanup();
				}
			});

			currentNavigator.getBattery().then(
				(battery) => {
					if (stopped || executionId !== executionCount) {
						return;
					}

					updateBatteryInfo(battery);
					for (const eventName of batteryEvents) {
						cleanups.push(
							listen(
								battery,
								eventName,
								() => {
									updateBatteryInfo(battery);
								},
								{ passive: true },
							),
						);
					}
				},
				() => {},
			);
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		isSupported: readonly(isSupported),
		charging: readonly(charging),
		chargingTime: readonly(chargingTime),
		dischargingTime: readonly(dischargingTime),
		level: readonly(level),
		stop,
	};
}
