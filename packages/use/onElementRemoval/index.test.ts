import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { onElementRemoval } from "./index";

class FakeWindowWithoutMutationObserver extends EventTarget {
	readonly document = document;
}

function createElementTree(root: ParentNode = document.body) {
	const grandElement = document.createElement("div");
	const parentElement = document.createElement("div");
	const targetElement = document.createElement("div");

	parentElement.append(targetElement);
	grandElement.append(parentElement);
	root.append(grandElement);

	return {
		grandElement,
		parentElement,
		targetElement,
	};
}

async function flushMutationObserver(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

describe("onElementRemoval", () => {
	afterEach(() => {
		document.body.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("calls the callback with mutation records when the target is removed", async () => {
		const { parentElement, targetElement } = createElementTree();
		const callback = vi.fn((mutationRecords: MutationRecord[]) => {
			expect(mutationRecords[0]).toBeInstanceOf(MutationRecord);
		});
		const stop = onElementRemoval(targetElement, callback);

		parentElement.removeChild(targetElement);
		await flushMutationObserver();

		expect(callback).toHaveBeenCalledTimes(1);

		stop();
	});

	it("calls the callback when an ancestor containing the target is removed", async () => {
		const { grandElement, parentElement, targetElement } = createElementTree();
		const callback = vi.fn();
		const stop = onElementRemoval(targetElement, callback);

		grandElement.removeChild(parentElement);
		await flushMutationObserver();

		expect(callback).toHaveBeenCalledTimes(1);

		stop();
	});

	it("observes a target assigned after setup", async () => {
		const { parentElement, targetElement } = createElementTree();
		const target = signal<Element | null>(null);
		const callback = vi.fn();
		const stop = onElementRemoval(target, callback);

		target.value = targetElement;
		parentElement.removeChild(targetElement);
		await flushMutationObserver();

		expect(callback).toHaveBeenCalledTimes(1);

		stop();
	});

	it("retargets when a target signal changes", async () => {
		const first = createElementTree();
		const second = createElementTree();
		const target = signal<Element | null>(first.targetElement);
		const callback = vi.fn();
		const stop = onElementRemoval(target, callback);

		second.parentElement.removeChild(second.targetElement);
		await flushMutationObserver();
		expect(callback).not.toHaveBeenCalled();

		target.value = second.targetElement;
		first.parentElement.removeChild(first.targetElement);
		await flushMutationObserver();
		expect(callback).not.toHaveBeenCalled();

		second.parentElement.append(second.targetElement);
		second.parentElement.removeChild(second.targetElement);
		await flushMutationObserver();
		expect(callback).toHaveBeenCalledTimes(1);

		stop();
	});

	it("observes a custom document target", async () => {
		const host = document.createElement("div");
		document.body.append(host);
		const shadowRoot = host.attachShadow({ mode: "open" });
		const { parentElement, targetElement } = createElementTree(shadowRoot);
		const callback = vi.fn();
		const stop = onElementRemoval(targetElement, callback, {
			document: shadowRoot,
		});

		parentElement.removeChild(targetElement);
		await flushMutationObserver();

		expect(callback).toHaveBeenCalledTimes(1);

		stop();
	});

	it("stops observing after the stop handle is called", async () => {
		const { parentElement, targetElement } = createElementTree();
		const callback = vi.fn();
		const stop = onElementRemoval(targetElement, callback);

		stop();
		stop();
		parentElement.removeChild(targetElement);
		await flushMutationObserver();

		expect(callback).not.toHaveBeenCalled();
	});

	it("stops observing when the active scope is disposed", async () => {
		const { parentElement, targetElement } = createElementTree();
		const callback = vi.fn();
		const scope = createScope();

		runWithScope(scope, () => {
			onElementRemoval(targetElement, callback);
		});
		disposeScope(scope);
		parentElement.removeChild(targetElement);
		await flushMutationObserver();

		expect(callback).not.toHaveBeenCalled();
	});

	it("does not use the default window when window is null", async () => {
		const { parentElement, targetElement } = createElementTree();
		const callback = vi.fn();
		const stop = onElementRemoval(targetElement, callback, { window: null });

		parentElement.removeChild(targetElement);
		await flushMutationObserver();

		expect(callback).not.toHaveBeenCalled();

		stop();
	});

	it("does not observe when MutationObserver is unavailable", async () => {
		const { parentElement, targetElement } = createElementTree();
		const callback = vi.fn();
		const stop = onElementRemoval(targetElement, callback, {
			window: new FakeWindowWithoutMutationObserver(),
		});

		parentElement.removeChild(targetElement);
		await flushMutationObserver();

		expect(callback).not.toHaveBeenCalled();

		stop();
	});
});
