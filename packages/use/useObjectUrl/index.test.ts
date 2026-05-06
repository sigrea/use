import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseObjectUrlUrlLike, UseObjectUrlWindowLike } from "../types";
import { useObjectUrl } from "./index";

function createUrlApi(): UseObjectUrlUrlLike & {
	readonly createObjectURL: ReturnType<typeof vi.fn>;
	readonly revokeObjectURL: ReturnType<typeof vi.fn>;
} {
	let count = 0;

	return {
		createObjectURL: vi.fn(() => {
			count += 1;
			return `blob:mock-${count}`;
		}),
		revokeObjectURL: vi.fn(),
	};
}

function createWindow(urlApi?: UseObjectUrlUrlLike): UseObjectUrlWindowLike {
	return Object.assign(new EventTarget(), {
		URL: urlApi,
	});
}

describe("useObjectUrl", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.unstubAllGlobals();
	});

	it("creates an object URL for the initial object", () => {
		const blob = new Blob(["hello"]);
		const urlApi = createUrlApi();
		const result = useObjectUrl(blob, { window: createWindow(urlApi) });

		expect(result.url.value).toBe("blob:mock-1");
		expect(urlApi.createObjectURL).toHaveBeenCalledWith(blob);

		result.stop();
		expect(urlApi.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
	});

	it("replaces and revokes the previous object URL when the object changes", () => {
		const source = signal<Blob | null>(new Blob(["first"]));
		const urlApi = createUrlApi();
		const result = useObjectUrl(source, { window: createWindow(urlApi) });

		source.value = new Blob(["second"]);

		expect(result.url.value).toBe("blob:mock-2");
		expect(urlApi.createObjectURL).toHaveBeenCalledTimes(2);
		expect(urlApi.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");

		result.stop();
		expect(urlApi.revokeObjectURL).toHaveBeenCalledWith("blob:mock-2");
	});

	it("releases the URL when the object becomes null", () => {
		const source = signal<Blob | null>(new Blob(["first"]));
		const urlApi = createUrlApi();
		const result = useObjectUrl(source, { window: createWindow(urlApi) });

		source.value = null;

		expect(result.url.value).toBeUndefined();
		expect(urlApi.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");

		result.stop();
		expect(urlApi.revokeObjectURL).toHaveBeenCalledTimes(1);
	});

	it("does not create a URL when window is null", () => {
		const urlApi = createUrlApi();
		const result = useObjectUrl(new Blob(["hello"]), { window: null });

		expect(result.url.value).toBeUndefined();
		expect(urlApi.createObjectURL).not.toHaveBeenCalled();

		result.stop();
	});

	it("uses the default window URL API", () => {
		const urlApi = createUrlApi();
		Object.defineProperty(window, "URL", {
			configurable: true,
			value: urlApi,
		});
		const result = useObjectUrl(new Blob(["hello"]));

		expect(result.url.value).toBe("blob:mock-1");

		result.stop();
		expect(urlApi.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
	});

	it("retargets when the window changes", () => {
		const firstUrl = createUrlApi();
		const secondUrl = createUrlApi();
		const windowTarget = signal<UseObjectUrlWindowLike | null>(
			createWindow(undefined),
		);
		const result = useObjectUrl(new Blob(["hello"]), {
			window: windowTarget,
		});

		expect(result.url.value).toBeUndefined();

		windowTarget.value = createWindow(firstUrl);
		expect(result.url.value).toBe("blob:mock-1");

		windowTarget.value = createWindow(secondUrl);
		expect(firstUrl.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
		expect(result.url.value).toBe("blob:mock-1");

		windowTarget.value = null;
		expect(secondUrl.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
		expect(result.url.value).toBeUndefined();

		result.stop();
	});

	it("is safe to stop more than once", () => {
		const urlApi = createUrlApi();
		const result = useObjectUrl(new Blob(["hello"]), {
			window: createWindow(urlApi),
		});

		result.stop();
		result.stop();

		expect(urlApi.revokeObjectURL).toHaveBeenCalledTimes(1);
		expect(result.url.value).toBeUndefined();
	});

	it("revokes once when the current scope is disposed", () => {
		const scope = createScope();
		const urlApi = createUrlApi();
		const result = runWithScope(scope, () =>
			useObjectUrl(new Blob(["hello"]), {
				window: createWindow(urlApi),
			}),
		);

		expect(result.url.value).toBe("blob:mock-1");

		disposeScope(scope);

		expect(urlApi.revokeObjectURL).toHaveBeenCalledTimes(1);
		expect(result.url.value).toBeUndefined();

		result.stop();
		expect(urlApi.revokeObjectURL).toHaveBeenCalledTimes(1);
	});
});
