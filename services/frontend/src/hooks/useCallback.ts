import { useMemo } from "./useMemo";

// ===== useCallback.ts =====
export function useCallback<T extends (...args: any[]) => any>(
  callback: T, 
  dependencies: any[]
): T {
  // useCallback is just useMemo for functions
  return useMemo(() => callback, dependencies);
}


// Example usage:

// ```jsx

// function Parent() {

// const [count, setCount] = useState(0);

// // This function is memoized and will only change when count changes

// const increment = useCallback(() => {

// setCount(count + 1);

// }, [count]);

// return <Child onIncrement={increment} />;

// }

// function Child({ onIncrement }) {

// // ... child that uses onIncrement

// }

// ```