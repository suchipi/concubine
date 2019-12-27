export type HookThunks<Instance> = {
  [name: string]: (instance: Instance) => Function;
};

export type HooksSystem<Instance, Hooks extends HookThunks<Instance>> = {
  withInstance<ReturnType>(
    instance: Instance,
    callback: () => ReturnType
  ): ReturnType;
  hooks: {
    [Name in keyof Hooks]: ReturnType<Hooks[Name]>;
  };
};

export function makeHooksSystem<Instance>() {
  return function provideHookThunks<Hooks extends HookThunks<Instance>>(
    hooks: Hooks,
    config: Partial<{
      prepareInstance: (instance: Instance) => void;
      releaseInstance: (instance: Instance) => void;
      hookUsedOutsideOfWithInstanceErrorMessage: string;
    }> = {}
  ): HooksSystem<Instance, Hooks> {
    let currentInstance: Instance | null = null;

    // @ts-ignore
    const resolvedHooks: HooksSystem<Instance, Hooks>["hooks"] = {};

    for (const name in hooks) {
      if (hooks.hasOwnProperty(name)) {
        // @ts-ignore
        resolvedHooks[name] = (...args: any[]) => {
          if (currentInstance == null) {
            throw new Error(
              config.hookUsedOutsideOfWithInstanceErrorMessage ||
                "Attempted to use a hook function, but there was no active instance."
            );
          }

          return hooks[name](currentInstance)(...args);
        };
      }
    }

    return {
      withInstance: (instance, callback) => {
        if (config.prepareInstance) {
          config.prepareInstance(instance);
        }
        currentInstance = instance;
        let ret;
        try {
          ret = callback();
        } finally {
          if (config.releaseInstance) {
            config.releaseInstance(instance);
          }
          currentInstance = null;
        }

        return ret;
      },
      hooks: resolvedHooks,
    };
  };
}
