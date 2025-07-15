import { HooksManager } from "./HooksManager";

export function useState<T>(initialValue: T): [T, (newValue: T | ((prev: T) => T)) => void] {
  const hooksManager = HooksManager.getInstance();
  /**Get the hooks object for the currently rendering component */
  const hooks = hooksManager.getCurrentComponentHooks();
  const index = hooks.currentStateIndex++;
  
  if (index >= hooks.states.length) { // at the first init index = 0 && currentStateIndex = 1
    console.log("first init in useState");
    hooks.states.push({ value: initialValue });
  }

  const currentState = hooks.states[index];
  
  // if (!hooks.states[index]) {
  //   hooks.states[index] = { value: initialValue };
  // }
  // CAPTURE COMPONENT DURING RENDER - This is the key fix
  const component = hooksManager.getCurrentComponent();

  const setState = (newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(currentState.value)
      : newValue;

    console.log("nextValue : ", nextValue, " | " , currentState.value);

    if (!Object.is(currentState.value, nextValue)) {
      currentState.value = nextValue;
      
      if (component) {
        // Check if component is still mounted before updating
        if (typeof component.isMountedComponent === 'function' && component.isMountedComponent()) {
          hooksManager.scheduleUpdate(component);
        }
      } else {
        console.warn('setState called without component context - component may have been unmounted');
      }
    }
  };

  return [currentState.value, setState];
}