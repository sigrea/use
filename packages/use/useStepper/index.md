---
category: State
---

# useStepper

Navigate through a named list of steps.

## Usage

```ts
import { useStepper } from "@sigrea/use";

const stepper = useStepper(["account", "profile", "confirm"], "profile");

stepper.current.value; // "profile"
stepper.index.value; // 1

stepper.goToNext();
stepper.current.value; // "confirm"

stepper.goBackTo("account");
stepper.current.value; // "account"
```

`index` is writable. Assigning a valid index moves to that step.

```ts
stepper.index.value = 2;
stepper.current.value; // "confirm"
```

## Object Steps

```ts
import { signal } from "@sigrea/core";
import { useStepper } from "@sigrea/use";

const title = signal("Account");
const stepper = useStepper(
	{
		account: title,
		profile: { title: "Profile" },
		confirm: { title: "Confirm" },
	},
	"account",
);

stepper.stepNames.value; // ["account", "profile", "confirm"]
stepper.current.value; // "Account"
```

The steps source and step values may be raw values, signals, computed values, or
getters. `initialStep` is resolved once when `useStepper` is created.

If the step list changes and the current step name still exists, the current step
is kept. If it disappears, the stepper moves to the first available step.
