import { useCallback } from "../../hooks/useCallback";
import { useEffect } from "../../hooks/useEffect";
import { useMemo } from "../../hooks/useMemo";
import { useState } from "../../hooks/useState";
import { ComponentFunction } from "../../types/global";
import { h } from "../../vdom/createElement";

// ===== Example Functional Components =====
export const CounterExample: ComponentFunction = (props) => {
  const initialCount = (props && typeof props.initialCount === "number") ? props.initialCount : 0;
  const [count, setCount] = useState(initialCount);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    console.log('Regex Counter changed:', count);
    setHistory(prev => [...prev, count]);
  }, [count]);

  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(0), []);

  const averageCount = useMemo(() => {
    return history.length > 0 ? 
      history.reduce((sum, val) => sum + val, 0) / history.length : 0;
  }, [history]);

  return h('div', { className: 'counter-example p-6 bg-white rounded-lg shadow-lg' },
    h('h2', { className: 'text-2xl font-bold mb-4' }, 'Enhanced Counter'),
    h('div', { className: 'text-center mb-4' },
      h('span', { className: 'text-4xl font-mono' }, count.toString())
    ),
    h('div', { className: 'flex gap-2 justify-center mb-4' },
      h('button', {
        onClick: increment,
        className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
      }, '+'),
      h('button', {
        onClick: decrement,
        className: 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
      }, '-'),
      h('button', {
        onClick: reset,
        className: 'px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600'
      }, 'Reset')
    ),
    h('div', { className: 'text-sm text-gray-600' },
      h('p', null, `History: ${history.slice(-5).join(', ')}`),
      h('p', null, `Average: ${averageCount.toFixed(2)}`)
    )
  );
};
