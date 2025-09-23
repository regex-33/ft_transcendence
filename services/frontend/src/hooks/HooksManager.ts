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
}

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
  
  /** Currently rendering component */
  private currentComponent: any = null;
  
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
    this.currentComponent = component;
    if (!this.componentHooks.has(component)) {
      this.componentHooks.set(component, {
        states: [],
        effects: [],
        memos: [],
        refs: [],
        currentStateIndex: 0,
        currentEffectIndex: 0,
        currentMemoIndex: 0,
        currentRefIndex: 0
      });
    }
    const hooks = this.componentHooks.get(component)!;
    hooks.currentStateIndex = 0;
    hooks.currentEffectIndex = 0;
    hooks.currentMemoIndex = 0;
    hooks.currentRefIndex = 0;
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
    if (!this.currentComponent) {
      throw new Error('Hooks can only be called inside components during render');
    }
    return this.componentHooks.get(this.currentComponent)!;
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
    return this.currentComponent;
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
    this.currentComponent = null;
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
      hooks.effects.forEach(effect => {
        if (effect.cleanup) {
          try {
            effect.cleanup();
          } catch (error) {
            console.error('Error during effect cleanup:', error);
          }
        }
      });
      this.componentHooks.delete(component);
    }
    
    this.renderQueue.delete(component);
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