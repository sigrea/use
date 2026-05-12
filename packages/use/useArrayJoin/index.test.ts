// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import { useArrayJoin } from "./index";

describe("useArrayJoin", () => {
	it("joins raw arrays with the default separator", () => {
		const result = useArrayJoin([
			"string",
			0,
			{ prop: "val" },
			false,
			[1],
			[[2]],
			null,
			undefined,
			[],
		]);

		expect(result.value).toBe("string,0,[object Object],false,1,2,,,");
		expect(useArrayJoin([]).value).toBe("");
	});

	it("tracks signal array replacement", () => {
		const list = signal(["foo", 0, { prop: "val" }]);
		const result = useArrayJoin(list);

		expect(result.value).toBe("foo,0,[object Object]");

		list.value = ["bar", 1];
		expect(result.value).toBe("bar,1");
	});

	it("tracks computed and getter arrays", () => {
		const source = signal(["a", "b", "c"]);
		const minimumLength = signal(1);
		const list = computed(() =>
			source.value.filter((value) => value.length >= minimumLength.value),
		);
		const result = useArrayJoin(() => list.value, "-");

		expect(result.value).toBe("a-b-c");

		source.value = ["a", "bb", "ccc"];
		minimumLength.value = 2;

		expect(result.value).toBe("bb-ccc");
	});

	it("tracks array items that are signals, computed values, or getters", () => {
		const first = signal("foo");
		const second = signal(0);
		const third = computed(() => second.value + 1);
		const fourth = signal("bar");
		const result = useArrayJoin([first, second, third, () => fourth.value]);

		expect(result.value).toBe("foo,0,1,bar");

		first.value = "baz";
		second.value = 1;
		fourth.value = "qux";

		expect(result.value).toBe("baz,1,2,qux");
	});

	it("accepts readonly signal arrays and readonly signal items", () => {
		const first = readonly(signal("foo"));
		const second = readonly(signal("bar"));
		const list = readonly(signal([first, second]));
		const result = useArrayJoin(list, "-");

		expect(result.value).toBe("foo-bar");
	});

	it("tracks reactive separators", () => {
		const list = [
			"string",
			0,
			{ prop: "val" },
			[1],
			[[2]],
			null,
			undefined,
			[],
		];
		const separator = signal<string | undefined>(undefined);
		const result = useArrayJoin(list, () => separator.value);

		expect(result.value).toBe("string,0,[object Object],1,2,,,");

		separator.value = "";
		expect(result.value).toBe("string0[object Object]12");

		separator.value = "-";
		expect(result.value).toBe("string-0-[object Object]-1-2---");
	});
});
