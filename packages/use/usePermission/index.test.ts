import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	UsePermissionNavigatorLike,
	UsePermissionPermissionsLike,
	UsePermissionSource,
} from "../types";
import { usePermission } from "./index";

class FakePermissionStatus extends EventTarget implements PermissionStatus {
	readonly name = "geolocation" as PermissionName;
	onchange: ((this: PermissionStatus, event: Event) => unknown) | null = null;

	constructor(public state: PermissionState) {
		super();
	}

	setState(state: PermissionState): void {
		this.state = state;
		const event = new Event("change");
		this.onchange?.call(this, event);
		this.dispatchEvent(event);
	}
}

function createPermissions(
	query: UsePermissionPermissionsLike<PermissionStatus>["query"],
): UsePermissionPermissionsLike<PermissionStatus> {
	return { query: vi.fn(query) };
}

function createNavigator(
	permissions?: UsePermissionPermissionsLike<PermissionStatus> | null,
): UsePermissionNavigatorLike<PermissionStatus> {
	return { permissions };
}

function createDeferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});

	return { promise, reject, resolve };
}

describe("usePermission", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("uses fallback values without Permissions API support", async () => {
		const permission = usePermission("geolocation", { navigator: null });

		expect(permission.isSupported.value).toBe(false);
		expect(permission.state.value).toBeUndefined();
		await expect(permission.query()).resolves.toBeUndefined();

		permission.stop();
	});

	it("queries a permission and tracks state changes", async () => {
		const status = new FakePermissionStatus("prompt");
		const permissions = createPermissions(async () => status);
		const permission = usePermission("geolocation", {
			navigator: createNavigator(permissions),
		});

		expect(permission.isSupported.value).toBe(true);
		expect(permission.state.value).toBeUndefined();
		await vi.waitFor(() => {
			expect(permission.state.value).toBe("prompt");
		});

		expect(permissions.query).toHaveBeenCalledWith({ name: "geolocation" });

		status.setState("granted");
		expect(permission.state.value).toBe("granted");

		permission.stop();
		status.setState("denied");
		expect(permission.state.value).toBe("granted");
	});

	it("passes descriptor options through to query", async () => {
		const status = new FakePermissionStatus("granted");
		const permissions = createPermissions(async () => status);
		const descriptor = { name: "midi", sysex: true } as const;
		const permission = usePermission(descriptor, {
			navigator: createNavigator(permissions),
		});

		await vi.waitFor(() => {
			expect(permission.state.value).toBe("granted");
		});

		expect(permissions.query).toHaveBeenCalledWith(descriptor);
		permission.stop();
	});

	it("keeps state undefined when query rejects", async () => {
		const permissions = createPermissions(async () => {
			throw new TypeError("unsupported permission");
		});
		const permission = usePermission("unknown-permission", {
			navigator: createNavigator(permissions),
		});

		expect(permission.isSupported.value).toBe(true);
		await vi.waitFor(() => {
			expect(permissions.query).toHaveBeenCalled();
		});

		expect(permission.state.value).toBeUndefined();
		await expect(permission.query()).resolves.toBeUndefined();
		permission.stop();
	});

	it("retargets when the permission source changes", async () => {
		const firstStatus = new FakePermissionStatus("prompt");
		const secondStatus = new FakePermissionStatus("granted");
		const firstQuery = createDeferred<PermissionStatus>();
		const permissions = createPermissions((descriptor) => {
			if (descriptor.name === "geolocation") {
				return firstQuery.promise;
			}

			return Promise.resolve(secondStatus);
		});
		const source = signal<UsePermissionSource>("geolocation");
		const permission = usePermission(source, {
			navigator: createNavigator(permissions),
		});

		source.value = "microphone";

		await vi.waitFor(() => {
			expect(permission.state.value).toBe("granted");
		});

		firstQuery.resolve(firstStatus);
		await Promise.resolve();
		firstStatus.setState("denied");
		expect(permission.state.value).toBe("granted");
		expect(permissions.query).toHaveBeenCalledWith({ name: "geolocation" });
		expect(permissions.query).toHaveBeenCalledWith({ name: "microphone" });

		permission.stop();
	});

	it("retargets when the navigator changes", async () => {
		const firstStatus = new FakePermissionStatus("prompt");
		const secondStatus = new FakePermissionStatus("granted");
		const navigator = signal<UsePermissionNavigatorLike<PermissionStatus>>(
			createNavigator(createPermissions(async () => firstStatus)),
		);
		const permission = usePermission("geolocation", { navigator });

		await vi.waitFor(() => {
			expect(permission.state.value).toBe("prompt");
		});

		navigator.value = createNavigator(
			createPermissions(async () => secondStatus),
		);
		expect(permission.state.value).toBeUndefined();
		await vi.waitFor(() => {
			expect(permission.state.value).toBe("granted");
		});

		firstStatus.setState("denied");
		expect(permission.state.value).toBe("granted");
		secondStatus.setState("prompt");
		expect(permission.state.value).toBe("prompt");

		permission.stop();
	});
});
