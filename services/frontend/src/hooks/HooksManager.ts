/**
 * Represents the state of a single hook instance
 */
interface HookState {
  /** The current value of the hook */
  value: any;
  /** Dependencies array for effects and memos */
  dependencies?: any[];
  /** Cleanup function for effects */
  cleanup?: () => void;
}

/**
 * Container for all hooks used by a component
 */
interface ComponentHooks {
  /** Array of useState hook states */
  states: HookState[];
  /** Array of useEffect hook states */
  effects: HookState[];
  /** Array of useMemo hook states */
  memos: HookState[];
  /** Array of useRef hook states */
  refs: HookState[];
  /** Current index for useState hooks */
  currentStateIndex: number;
  /** Current index for useEffect hooks */
  currentEffectIndex: number;
  /** Current index for useMemo hooks */
  currentMemoIndex: number;
  /** Current index for useRef hooks */
  currentRefIndex: number;
  /** Child functional component hook contexts */
  childContexts: ComponentHooks[];
  /** Current index for child functional components */
  currentChildIndex: number;
  /** Identifier for the component/function that owns this hook bucket */
  ownerId?: symbol;
}

interface HookContext {
  componentInstance: any;
  hooks: ComponentHooks;
}

const createEmptyHooks = (ownerId?: symbol): ComponentHooks => ({
  states: [],
  effects: [],
  memos: [],
  refs: [],
  currentStateIndex: 0,
  currentEffectIndex: 0,
  currentMemoIndex: 0,
  currentRefIndex: 0,
  childContexts: [],
  currentChildIndex: 0,
  ownerId,
});

/**
 * Singleton class that manages React-like hooks for components.
 * Handles hook state, scheduling updates, and cleanup.
 * 
 * @example
 * ```typescript
 * // Get the hooks manager instance
 * const hooksManager = HooksManager.getInstance();
 * 
 * // In a component class
 * class MyComponent {
 *   render() {
 *     // Set this component as current for hook calls
 *     hooksManager.setCurrentComponent(this);
 *     
 *     // Now hooks can be called
 *     const [count, setCount] = useState(0);
 *     
 *     // Clear current component after render
 *     hooksManager.clearCurrentComponent();
 *     
 *     return createElement('div', null, `Count: ${count}`);
 *   }
 *   
 *   update() {
 *     // Re-render logic
 *     this.forceUpdate();
 *   }
 *   
 *   isMountedComponent() {
 *     return this.mounted;
 *   }
 * }
 * ```
 */
export class HooksManager {
  /** Singleton instance */
  private static instance: HooksManager;
  
  /** Prevent instantiation from other classes */
  private constructor() { }

  /** WeakMap storing hooks for each component instance */
  private componentHooks: WeakMap<any, ComponentHooks> = new WeakMap();
  
  /** Stack of active hook contexts (supports nested functional components) */
  private contextStack: HookContext[] = [];
  
  /** Currently rendering component (kept for backward compatibility) */
  private currentComponent: any = null;
  
  /** Cache of component/function identifiers */
  private componentIds: WeakMap<Function, symbol> = new WeakMap();
  
  /** Components scheduled for re-render */
  private renderQueue: Set<any> = new Set();
  
  /** Whether updates are currently scheduled */
  private isScheduled = false;

  /**
   * Gets the singleton instance of HooksManager
   * 
   * @returns The HooksManager instance
   * 
   * @example
   * ```typescript
   * const manager = HooksManager.getInstance();
   * ```
   */
  static getInstance(): HooksManager {
    if (!HooksManager.instance) {
      HooksManager.instance = new HooksManager();
    }
    return HooksManager.instance;
  }

  /**
   * Sets the current component for hook calls and initializes its hook state
   * 
   * @param component - The component instance to set as current
   * 
   * @example
   * ```typescript
   * class MyComponent {
   *   render() {
   *     hooksManager.setCurrentComponent(this);
   *     // Now hooks can be called safely
   *     const [state, setState] = useState(initialValue);
   *     // ... rest of render logic
   *   }
   * }
   * ```
   */
  setCurrentComponent(component: any): void {
    let hooks = this.componentHooks.get(component);
    if (!hooks) {
      hooks = createEmptyHooks();
      this.componentHooks.set(component, hooks);
    }
    if (!hooks.childContexts) {
      hooks.childContexts = [];
    }
    this.resetHookIndices(hooks);
    this.contextStack.push({ componentInstance: component, hooks });
    this.currentComponent = component;
  }

  private resetHookIndices(hooks: ComponentHooks): void {
    hooks.currentStateIndex = 0;
    hooks.currentEffectIndex = 0;
    hooks.currentMemoIndex = 0;
    hooks.currentRefIndex = 0;
    hooks.currentChildIndex = 0;
  }

  /**
   * Schedules a component for re-render with batching and error handling
   * 
   * @param component - The component to schedule for update
   * 
   * @example
   * ```typescript
   * // Inside a useState setter
   * function setState(newValue) {
   *   // Update state value
   *   hookState.value = newValue;
   *   
   *   // Schedule component re-render
   *   hooksManager.scheduleUpdate(currentComponent);
   * }
   * 
   * // Multiple updates in same render cycle are batched
   * setState(1);
   * setState(2); // Only one re-render will occur
   * setState(3);
   * ```
   */
  scheduleUpdate(component: any): void {
    if (!component) {
      console.warn('scheduleUpdate called with null/undefined component');
      return;
    }

    if (typeof component.isMountedComponent === 'function' && !component.isMountedComponent()) {
      console.warn('Attempting to update unmounted component');
      return;
    }

    this.renderQueue.add(component);
    
    if (!this.isScheduled) {
      this.isScheduled = true;
      // Use microtask for better performance
      Promise.resolve().then(() => {
        this.flushUpdates();
      });
    }
  }

  /**
   * Gets the hook state container for the current component
   * 
   * @returns The ComponentHooks object for the current component
   * @throws Error if called outside of a component render
   * 
   * @example
   * ```typescript
   * // Inside a hook implementation
   * function useState(initialValue) {
   *   const hooks = hooksManager.getCurrentComponentHooks();
   *   const index = hooks.currentStateIndex++;
   *   
   *   if (!hooks.states[index]) {
   *     hooks.states[index] = { value: initialValue };
   *   }
   *   
   *   return [hooks.states[index].value, newValue => {
   *     hooks.states[index].value = newValue;
   *     hooksManager.scheduleUpdate(hooksManager.getCurrentComponent());
   *   }];
   * }
   * ```
   */
  getCurrentComponentHooks(): ComponentHooks {
    const context = this.contextStack[this.contextStack.length - 1];
    if (!context) {
      throw new Error('Hooks can only be called inside components during render');
    }
    return context.hooks;
  }

  /**
   * Gets the currently rendering component
   * 
   * @returns The current component or null if none is set
   * 
   * @example
   * ```typescript
   * // Inside a hook
   * const currentComponent = hooksManager.getCurrentComponent();
   * if (currentComponent) {
   *   // Safe to schedule updates
   *   hooksManager.scheduleUpdate(currentComponent);
   * }
   * ```
   */
  getCurrentComponent(): any {
    if (this.contextStack.length === 0) {
      return null;
    }
    return this.contextStack[this.contextStack.length - 1].componentInstance;
  }
  
  /**
   * Clears the current component reference
   * Should be called after component rendering is complete
   * 
   * @example
   * ```typescript
   * class MyComponent {
   *   render() {
   *     hooksManager.setCurrentComponent(this);
   *     
   *     // Render logic with hooks
   *     const vnode = createElement('div', null, 'Hello');
   *     
   *     // Clear current component
   *     hooksManager.clearCurrentComponent();
   *     
   *     return vnode;
   *   }
   * }
   * ```
   */
  clearCurrentComponent(): void {
    if (this.contextStack.length > 0) {
      this.contextStack.pop();
    }
    this.currentComponent = this.contextStack.length > 0
      ? this.contextStack[this.contextStack.length - 1].componentInstance
      : null;
  }

  /**
   * Begins a new hook context for a nested functional component
   */
  beginFunctionalComponent(componentFn: Function): void {
    const parentContext = this.contextStack[this.contextStack.length - 1];
    if (!parentContext) {
      throw new Error('Functional components must be rendered within an active component context');
    }

    const ownerId = this.getOrCreateComponentId(componentFn);
    const parentHooks = parentContext.hooks;
    const index = parentHooks.currentChildIndex++;

    if (!parentHooks.childContexts[index] || parentHooks.childContexts[index].ownerId !== ownerId) {
      parentHooks.childContexts[index] = createEmptyHooks(ownerId);
    }

    const childHooks = parentHooks.childContexts[index];
    this.resetHookIndices(childHooks);

    this.contextStack.push({
      componentInstance: parentContext.componentInstance,
      hooks: childHooks,
    });
    this.currentComponent = parentContext.componentInstance;
  }

  /**
   * Ends the current nested functional component hook context
   */
  endFunctionalComponent(): void {
    if (this.contextStack.length <= 1) {
      // The root component context will be cleared via clearCurrentComponent
      return;
    }

    this.contextStack.pop();
    this.currentComponent = this.contextStack[this.contextStack.length - 1]?.componentInstance ?? null;
  }

  private getOrCreateComponentId(componentFn: Function): symbol {
    let id = this.componentIds.get(componentFn);
    if (!id) {
      id = Symbol(componentFn.name || 'anonymous_component');
      this.componentIds.set(componentFn, id);
    }
    return id;
  }

  /**
   * Processes all scheduled component updates with error handling
   * Called automatically via microtask scheduling
   * 
   * @private
   * 
   * @example
   * ```typescript
   * // This method is called automatically, but can be triggered manually for testing
   * hooksManager.forceFlushUpdates();
   * ```
   */
  private flushUpdates(): void {
    const componentsToUpdate = Array.from(this.renderQueue);
    this.renderQueue.clear();
    this.isScheduled = false;

    componentsToUpdate.forEach(component => {
      if (!component) return;
      
      // Double-check component is still mounted
      if (typeof component.isMountedComponent === 'function' && !component.isMountedComponent()) {
        return;
      }

      if (typeof component.update === 'function') {
        try {
          component.update();
        } catch (error) {
          console.error('Error updating component:', error);
        }
      } else {
        console.warn('Component does not have update method:', component);
      }
    });
  }

  /**
   * Cleans up all hooks and state for a component
   * Should be called when component unmounts
   * 
   * @param component - The component to clean up
   * 
   * @example
   * ```typescript
   * class MyComponent {
   *   componentWillUnmount() {
   *     // Clean up all hooks and effects
   *     hooksManager.cleanup(this);
   *   }
   * }
   * 
   * // Or in a framework's unmount logic
   * function unmountComponent(component) {
   *   hooksManager.cleanup(component);
   *   // ... other cleanup
   * }
   * ```
   */
  cleanup(component: any): void {
    const hooks = this.componentHooks.get(component);
    if (hooks) {
      this.cleanupHooksTree(hooks);
      this.componentHooks.delete(component);
    }
    this.renderQueue.delete(component);
  }

  private cleanupHooksTree(hooks: ComponentHooks): void {
    hooks.effects.forEach(effect => {
      if (effect.cleanup) {
        try {
          effect.cleanup();
        } catch (error) {
          console.error('Error during effect cleanup:', error);
        }
      }
    });

    hooks.childContexts.forEach(childHooks => this.cleanupHooksTree(childHooks));

    hooks.states = [];
    hooks.effects = [];
    hooks.memos = [];
    hooks.refs = [];
    hooks.childContexts = [];
  }

  /**
   * Gets the hook state for a specific component (for debugging)
   * 
   * @param component - The component to get hooks for
   * @returns The ComponentHooks object or undefined if not found
   * 
   * @example
   * ```typescript
   * // Debugging component hooks
   * const hooks = hooksManager.getComponentHooks(myComponent);
   * console.log('Component has', hooks?.states.length, 'useState hooks');
   * console.log('Component has', hooks?.effects.length, 'useEffect hooks');
   * ```
   */
  getComponentHooks(component: any): ComponentHooks | undefined {
    return this.componentHooks.get(component);
  }

  /**
   * Gets the number of components waiting for re-render
   * 
   * @returns Number of components in render queue
   * 
   * @example
   * ```typescript
   * // Check if updates are pending
   * if (hooksManager.getRenderQueueSize() > 0) {
   *   console.log('Updates pending...');
   * }
   * ```
   */
  getRenderQueueSize(): number {
    return this.renderQueue.size;
  }

  /**
   * Immediately processes all pending updates (for debugging/testing)
   * 
   * @example
   * ```typescript
   * // In tests, force immediate updates
   * setState(newValue);
   * hooksManager.forceFlushUpdates(); // Update happens synchronously
   * expect(component.state).toBe(newValue);
   * 
   * // Or when debugging
   * console.log('Before flush:', hooksManager.getRenderQueueSize());
   * hooksManager.forceFlushUpdates();
   * console.log('After flush:', hooksManager.getRenderQueueSize()); // Should be 0
   * ```
   */
  forceFlushUpdates(): void {
    if (this.renderQueue.size > 0) {
      this.flushUpdates();
    }
  }
}