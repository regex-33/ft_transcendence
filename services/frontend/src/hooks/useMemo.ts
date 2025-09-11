import { HooksManager } from "./HooksManager";

export function useMemo<T>(factory: () => T, dependencies: any[]): T {
  const hooksManager = HooksManager.getInstance();
  const hooks = hooksManager.getCurrentComponentHooks();
  const index = hooks.currentMemoIndex++;

  // Initialize memo if it doesn't exist
  if (index >= hooks.memos.length) {
    hooks.memos.push({ value: factory(), dependencies: [...dependencies] });
  }

  const currentMemo = hooks.memos[index];
  const hasChanged = !currentMemo.dependencies ||
    dependencies.length !== currentMemo.dependencies.length ||
    dependencies.some((dep, i) => !Object.is(dep, currentMemo.dependencies![i]));

  if (hasChanged) {
    currentMemo.value = factory();
    currentMemo.dependencies = [...dependencies];
  }

  return currentMemo.value;
}
