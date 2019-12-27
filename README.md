# `concubine`

`concubine` provides the framework necessary to create a "Hooks" system with full TypeScript typings, like [the one React uses](https://reactjs.org/docs/hooks-intro.html).

## Usage

`concubine` cooperates with an instance class you define which maintains the state across hook calls. (These are analagous to the fiber nodes in React, if you know what those are).

You create a "hooks system" by calling `concubine`'s `makeHooksSystem` function with an instance type and a map of functions that return user-facing hook functions, given the current instance:

```ts
// Your instance type. This is a contrived example.
class Instance {
  tagName: string = "div";
}

const hooksSystem = makeHooksSystem<Instance>()({
  useTagName: (instance) => () => instance.tagName,
});
```

The returned `hooksSystem` has two properties on it: `withInstance` and `hooks`. `withInstance` is a function that you call to set the current instance and do some work, and `hooks` is an Object with all your user-facing hook functions on it.

To use React terminology: `hooks` has functions on it like `useState`, `useRef`, etc, and `withInstance` is what you use to set the current fiber node and render.

```ts
// The `hooks` property contains your user-facing API.
const { useTagName } = hooksSystem.hooks;

export { useTagName };

// The `withInstance` property is your internal API.
const node = new Node();
hooksSystem.withInstance(node, () => {
  // call user code (hook-using code) here.
});
```

In practice, you will probably want to store some state in your instances, so that on subsequent "render"s, you can retrieve that state. See "Examples" below to see how to do that.

#### Before and After callbacks

If you want to always run some code before and/or after each `withInstance` call, you can pass a config Object with the keys `prepareInstance` and/or `releaseInstance` on it as the second argument to `makeHooksSystem`:

```ts
// Your instance type. This is a contrived example.
class Instance {
  tagName: string = "div";
}

const hooksSystem = makeHooksSystem<Instance>()(
  {
    useTagName: (instance) => () => instance.tagName,
  },
  {
    prepareInstance: (instance) => {
      // This runs before each withInstance callback
    },
    releaseInstance: (instance) => {
      // This runs after each withInstance callback
    },
  }
);
```

#### Error messaging

If a user tries to use a hook function, but they're not doing so from within a stack where you called `withInstance`, then an Error will be thrown. By default, the Error message is: `"Attempted to use a hook function, but there was no active instance."`. This error message is pretty generic, so you should probably customize it by passing a config Object with the key `hookUsedOutsideOfWithInstanceErrorMessage` on it as the second argument to `makeHooksSystem`:

```ts
const hooksSystem = makeHooksSystem<Instance>()(
  {
    useTagName: (instance) => () => instance.tagName,
  },
  {
    hookUsedOutsideOfWithInstanceErrorMessage:
      "Attempted to use a hook function outside of a Component's render method.",
  }
);
```

## Examples

Here is an example of an instance that has some state slots, and a `useState` hook that reads from and writes to those state slots (just like React's).

```ts
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
```

## FAQ

> Is this what React uses internally for their hooks system?

No, and if you're on the React team and you're reading this, please don't use this for React's hooks system. I don't want the attention. Fork it if you want though.

> Why is it called `concubine`?

It's a pun. Concubine is a synonym for "hooker", and this package sets up the hooks. So it's the "hooker".

## License

MIT
