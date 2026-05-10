import { describe, expect, it } from "vitest";

import { makeDestructurable } from "./index";

describe("makeDestructurable", () => {
	it("supports object and array destructuring", () => {
		const foo = { name: "foo" };
		const bar = 1024;
		const result = makeDestructurable({ bar, foo }, [foo, bar]);

		const { bar: objectBar, foo: objectFoo } = result;
		const [arrayFoo, arrayBar] = result;

		expect(objectFoo).toBe(foo);
		expect(objectBar).toBe(bar);
		expect(arrayFoo).toBe(foo);
		expect(arrayBar).toBe(bar);
		expect([...result]).toEqual([foo, bar]);
	});

	it("adds a non-enumerable iterator to an object clone", () => {
		const source = { first: "one", second: "two" };
		const result = makeDestructurable(source, ["one", "two"]);

		expect(result).not.toBe(source);
		expect(Object.keys(result)).toEqual(["first", "second"]);
		expect({ ...result }).toEqual(source);
		expect(
			Object.getOwnPropertyDescriptor(result, Symbol.iterator),
		).toMatchObject({
			enumerable: false,
		});
		expect(
			Object.getOwnPropertyDescriptor(source, Symbol.iterator),
		).toBeUndefined();

		result.first = "changed";

		expect(source.first).toBe("one");
	});

	it("uses an array fallback when Symbol is unavailable", () => {
		const symbolDescriptor = Object.getOwnPropertyDescriptor(
			globalThis,
			"Symbol",
		);

		Object.defineProperty(globalThis, "Symbol", {
			configurable: true,
			value: undefined,
			writable: true,
		});

		try {
			const result = makeDestructurable({ bar: 1024, foo: "foo" }, [
				"foo",
				1024,
			]);

			expect(Array.isArray(result)).toBe(true);
			expect(result.foo).toBe("foo");
			expect(result.bar).toBe(1024);
			expect(result[0]).toBe("foo");
			expect(result[1]).toBe(1024);
		} finally {
			if (symbolDescriptor) {
				Object.defineProperty(globalThis, "Symbol", symbolDescriptor);
			} else {
				Reflect.deleteProperty(globalThis, "Symbol");
			}
		}
	});
});
