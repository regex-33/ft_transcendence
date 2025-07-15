import { HooksManager } from "./HooksManager";

// ===== useRef.ts (No changes needed) =====
export function useRef<T>(initialValue: T): { current: T } {
  const hooksManager = HooksManager.getInstance();
  const hooks = hooksManager.getCurrentComponentHooks();
  const index = hooks.currentRefIndex++;

  // Initialize ref if it doesn't exist
  if (index >= hooks.refs.length) {
    hooks.refs.push({ value: { current: initialValue } });
  }

  return hooks.refs[index].value;
}

// Example usage:

// ```jsx

// function TextInput() {

// const inputRef = useRef(null);

// useEffect(() => {

// // Focus the input when the component mounts

// inputRef.current.focus();

// }, []);

// return <input ref={inputRef} type="text" />;

// }

// ```

// Explanation:

// - `useRef` creates a mutable object with a `current` property.

// - The ref object persists across re-renders without causing re-renders when it changes.

// - The initial value is set only on the first render.