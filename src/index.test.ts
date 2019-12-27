import { makeHooksSystem } from ".";

class StateHolder {
  stateSlots: Map<number, any> = new Map();
  currentStateSlot: number = 0;

  advanceStateSlot() {
    this.currentStateSlot++;
  }

  getOrInitStateSlot<T>(index: number, initialValue: T): T {
    if (this.stateSlots.has(index)) {
      return this.stateSlots.get(index);
    } else {
      this.setStateSlot(index, initialValue);
      return this.stateSlots.get(index);
    }
  }

  setStateSlot<T>(index: number, value: T) {
    this.stateSlots.set(index, value);
  }
}

const hooksSystem = makeHooksSystem<StateHolder>()(
  {
    useState: (instance) => <T>(
      initialValue: T
    ): [T, (nextValue: T) => void] => {
      const slot = instance.currentStateSlot;
      const value = instance.getOrInitStateSlot(slot, initialValue);
      const setValue = (nextValue: T) => instance.setStateSlot(slot, nextValue);
      instance.advanceStateSlot();

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

  const holder = new StateHolder();
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
