// @vitest-environment node

import {
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	signal,
	trackMolecule,
	unmountMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	UseGeolocationCoordinates,
	UseGeolocationGeolocationLike,
	UseGeolocationNavigatorLike,
	UseGeolocationPositionLike,
} from "../types";
import { useGeolocation } from "./index";

function createCoordinates(
	options: Partial<UseGeolocationCoordinates> = {},
): UseGeolocationCoordinates {
	return {
		accuracy: 12,
		altitude: null,
		altitudeAccuracy: null,
		heading: null,
		latitude: 35.681236,
		longitude: 139.767125,
		speed: null,
		...options,
	};
}

function createPosition(
	coords: UseGeolocationCoordinates = createCoordinates(),
	timestamp = 1000,
): UseGeolocationPositionLike {
	return { coords, timestamp };
}

function createError(
	code: GeolocationPositionError["code"],
	message: string,
): GeolocationPositionError {
	return { code, message } as GeolocationPositionError;
}

class FakeGeolocation implements UseGeolocationGeolocationLike {
	private nextWatchId = 1;
	lastErrorCallback: PositionErrorCallback | null | undefined;
	lastSuccessCallback: PositionCallback | undefined;
	readonly watches = new Map<
		number,
		{
			errorCallback?: PositionErrorCallback | null;
			options?: PositionOptions;
			successCallback: PositionCallback;
		}
	>();
	readonly clearWatch = vi.fn((watchId: number) => {
		this.watches.delete(watchId);
	});
	readonly watchPosition = vi.fn(
		(
			successCallback: PositionCallback,
			errorCallback?: PositionErrorCallback | null,
			options?: PositionOptions,
		): number => {
			this.lastErrorCallback = errorCallback;
			this.lastSuccessCallback = successCallback;
			const watchId = this.nextWatchId;
			this.nextWatchId += 1;
			this.watches.set(watchId, {
				errorCallback,
				options,
				successCallback,
			});
			return watchId;
		},
	);

	emitPosition(watchId: number, position: UseGeolocationPositionLike): void {
		this.watches.get(watchId)?.successCallback(position as GeolocationPosition);
	}

	emitError(watchId: number, error: GeolocationPositionError): void {
		this.watches.get(watchId)?.errorCallback?.(error);
	}
}

function createNavigator(
	geolocation?: UseGeolocationGeolocationLike | null,
): UseGeolocationNavigatorLike {
	return { geolocation };
}

describe("useGeolocation", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.unstubAllGlobals();
	});

	it("stays unsupported when navigator is null", () => {
		const globalGeolocation = new FakeGeolocation();
		vi.stubGlobal("navigator", createNavigator(globalGeolocation));
		const geolocation = useGeolocation({ navigator: null });

		expect(geolocation.isSupported.value).toBe(false);
		expect(geolocation.isActive.value).toBe(false);
		expect(geolocation.coords.value).toBeNull();
		expect(geolocation.locatedAt.value).toBeNull();
		expect(geolocation.error.value).toBeNull();
		expect(globalGeolocation.watchPosition).not.toHaveBeenCalled();

		geolocation.resume();
		expect(globalGeolocation.watchPosition).not.toHaveBeenCalled();

		geolocation.stop();
	});

	it("stays unsupported without watch and clear support", () => {
		const withoutWatch = useGeolocation({
			navigator: createNavigator({
				clearWatch: vi.fn(),
			} as unknown as UseGeolocationGeolocationLike),
		});
		const withoutClear = useGeolocation({
			navigator: createNavigator({
				watchPosition: vi.fn(),
			} as unknown as UseGeolocationGeolocationLike),
		});

		expect(withoutWatch.isSupported.value).toBe(false);
		expect(withoutClear.isSupported.value).toBe(false);
		expect(withoutWatch.isActive.value).toBe(false);
		expect(withoutClear.isActive.value).toBe(false);

		withoutWatch.stop();
		withoutClear.stop();
	});

	it("starts manually and does not create duplicate watches", () => {
		const target = new FakeGeolocation();
		const geolocation = useGeolocation({
			enableHighAccuracy: true,
			immediate: false,
			maximumAge: 2000,
			navigator: createNavigator(target),
			timeout: 1000,
		});

		expect(geolocation.isSupported.value).toBe(true);
		expect(geolocation.isActive.value).toBe(false);
		expect(target.watchPosition).not.toHaveBeenCalled();

		geolocation.resume();
		geolocation.resume();

		expect(geolocation.isActive.value).toBe(true);
		expect(target.watchPosition).toHaveBeenCalledOnce();
		expect(target.watches.get(1)?.options).toEqual({
			enableHighAccuracy: true,
			maximumAge: 2000,
			timeout: 1000,
		});

		geolocation.stop();
	});

	it("clones coordinates and records located time", () => {
		const target = new FakeGeolocation();
		const geolocation = useGeolocation({
			immediate: false,
			navigator: createNavigator(target),
		});
		geolocation.resume();
		const coords = createCoordinates({ latitude: 1, longitude: 2 });

		target.emitPosition(1, createPosition(coords, 1234));
		Object.defineProperty(coords, "latitude", { value: 9 });

		expect(geolocation.coords.value).toEqual({
			accuracy: 12,
			altitude: null,
			altitudeAccuracy: null,
			heading: null,
			latitude: 1,
			longitude: 2,
			speed: null,
		});
		expect(geolocation.locatedAt.value).toBe(1234);
		expect(geolocation.error.value).toBeNull();

		geolocation.stop();
	});

	it("keeps the last position on errors and clears the error on success", () => {
		const target = new FakeGeolocation();
		const geolocation = useGeolocation({
			immediate: false,
			navigator: createNavigator(target),
		});
		geolocation.resume();
		target.emitPosition(
			1,
			createPosition(createCoordinates({ latitude: 1 }), 100),
		);

		const error = createError(1, "denied");
		target.emitError(1, error);

		expect(geolocation.error.value).toBe(error);
		expect(geolocation.coords.value?.latitude).toBe(1);
		expect(geolocation.locatedAt.value).toBe(100);

		target.emitPosition(
			1,
			createPosition(createCoordinates({ latitude: 2 }), 200),
		);
		expect(geolocation.error.value).toBeNull();
		expect(geolocation.coords.value?.latitude).toBe(2);
		expect(geolocation.locatedAt.value).toBe(200);

		geolocation.stop();
	});

	it("pauses and stops the current watch", () => {
		const target = new FakeGeolocation();
		const geolocation = useGeolocation({
			navigator: createNavigator(target),
		});

		expect(geolocation.isActive.value).toBe(true);
		geolocation.pause();
		geolocation.pause();

		expect(target.clearWatch).toHaveBeenCalledOnce();
		expect(target.clearWatch).toHaveBeenCalledWith(1);
		expect(geolocation.isActive.value).toBe(false);

		geolocation.resume();
		expect(target.watchPosition).toHaveBeenCalledTimes(2);

		geolocation.stop();
		expect(target.clearWatch).toHaveBeenCalledTimes(2);

		geolocation.resume();
		expect(target.watchPosition).toHaveBeenCalledTimes(2);
	});

	it("retargets navigators and ignores stale callbacks", () => {
		const first = new FakeGeolocation();
		const second = new FakeGeolocation();
		const navigator = signal<UseGeolocationNavigatorLike | null>(
			createNavigator(first),
		);
		const geolocation = useGeolocation({ navigator });

		first.emitPosition(1, createPosition(createCoordinates({ latitude: 1 })));
		expect(geolocation.coords.value?.latitude).toBe(1);
		const staleSuccess = first.watches.get(1)?.successCallback;

		navigator.value = createNavigator(second);

		expect(first.clearWatch).toHaveBeenCalledWith(1);
		expect(second.watchPosition).toHaveBeenCalledOnce();
		expect(geolocation.coords.value).toBeNull();

		staleSuccess?.(
			createPosition(createCoordinates({ latitude: 9 })) as GeolocationPosition,
		);
		expect(geolocation.coords.value).toBeNull();

		second.emitPosition(1, createPosition(createCoordinates({ latitude: 2 })));
		expect(geolocation.coords.value?.latitude).toBe(2);

		geolocation.stop();
	});

	it("does not activate when watchPosition returns zero", () => {
		const target = new FakeGeolocation();
		const navigator = signal<UseGeolocationNavigatorLike | null>(
			createNavigator(target),
		);
		target.watchPosition.mockReturnValueOnce(0);
		const geolocation = useGeolocation({
			navigator,
		});
		navigator.value = null;
		target.lastErrorCallback?.(createError(2, "inactive"));

		expect(geolocation.isActive.value).toBe(false);
		expect(geolocation.error.value).toBeNull();
		expect(target.clearWatch).not.toHaveBeenCalled();

		geolocation.stop();
	});

	it("starts on molecule mount and pauses on unmount", () => {
		const target = new FakeGeolocation();
		const GeolocationMolecule = molecule(() =>
			useGeolocation({ navigator: createNavigator(target) }),
		);
		const instance = GeolocationMolecule();
		trackMolecule(instance);

		expect(target.watchPosition).not.toHaveBeenCalled();

		mountMolecule(instance);
		expect(instance.isActive.value).toBe(true);
		expect(target.watchPosition).toHaveBeenCalledOnce();

		unmountMolecule(instance);
		expect(instance.isActive.value).toBe(false);
		expect(target.clearWatch).toHaveBeenCalledWith(1);
	});
});
