import { HooksManager } from "./HooksManager";

export function useEffect(effect: () => void | (() => void), dependencies?: any[]): void {
  const hooksManager = HooksManager.getInstance();
  const hooks = hooksManager.getCurrentComponentHooks();
  const index = hooks.currentEffectIndex++;

  // init effect if it doesn't exist
  if (index >= hooks.effects.length) {
    hooks.effects.push({ value: null, dependencies: undefined });
  }

  const currentEffect = hooks.effects[index];
  const hasChanged = !dependencies || 
    !currentEffect.dependencies || 
    dependencies.length !== currentEffect.dependencies.length ||
    dependencies.some((dep, i) => !Object.is(dep, currentEffect.dependencies![i]));

  console.log("--------------------------");
  console.log("hasChanged: ", hasChanged);
  console.log("--------------------------");
  if (hasChanged) {
    if (currentEffect.cleanup) {
      console.log("hasChanged: ", hasChanged);
      currentEffect.cleanup();
    }

    Promise.resolve().then(() => {
      const cleanup = effect();
      currentEffect.cleanup = typeof cleanup === 'function' ? cleanup : undefined;
    });
    
    currentEffect.dependencies = dependencies ? [...dependencies] : undefined;
  }
}