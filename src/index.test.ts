import { makeHooksSystem } from ".";
class Instance {
  stateSlots: Map<number, any> = new Map();
  currentStateSlot: number = 0;
}

const hooksSystem = makeHooksSystem<Instance>()(
  {
    useState: (instance) => <T>(
      initialValue: T
    ): [T, (nextValue: T) => void] => {
      const slot = instance.currentStateSlot;

      let value;
      if (instance.stateSlots.has(slot)) {
        value = instance.stateSlots.get(slot);
      } else {
        instance.stateSlots.set(slot, initialValue);
        value = initialValue;
      }

      const setValue = (nextValue: T) => {
        instance.stateSlots.set(slot, nextValue);
      };

      instance.currentStateSlot++;

      return [value, setValue];
    },
  },
  {
    prepareInstance(instance) {
      instance.currentStateSlot = 0;
    },
  }
);

test("hooks system", () => {
  expect(hooksSystem.hooks).toMatchInlineSnapshot(`
    Object {
      "useState": [Function],
    }
  `);

  const holder = new Instance();
  hooksSystem.withInstance(holder, () => {
    const [slot0, setSlot0] = hooksSystem.hooks.useState(0);

    expect(slot0).toBe(0);
    setSlot0(99);

    const [slot1] = hooksSystem.hooks.useState(45);
    expect(slot1).toBe(45);
  });

  hooksSystem.withInstance(holder, () => {
    const [slot0] = hooksSystem.hooks.useState(0);
    expect(slot0).toBe(99);

    const [slot1] = hooksSystem.hooks.useState(45);
    expect(slot1).toBe(45);
  });
});

test("error message when using hook function outside withInstance", () => {
  expect(() => {
    hooksSystem.hooks.useState(46);
  }).toThrowErrorMatchingInlineSnapshot(
    `"Attempted to use a hook function, but there was no active instance."`
  );
});

test("error message when using hook function outside withInstance - custom message", () => {
  const otherHookSystem = makeHooksSystem<Instance>()(
    {
      useSomething: (instance) => () => 45,
    },
    {
      hookUsedOutsideOfWithInstanceErrorMessage: "Uh oh, that's not good",
    }
  );

  expect(() => {
    otherHookSystem.hooks.useSomething();
  }).toThrowErrorMatchingInlineSnapshot(`"Uh oh, that's not good"`);
});
