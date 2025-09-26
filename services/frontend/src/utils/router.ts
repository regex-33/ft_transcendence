// ===== src/utils/router.ts (Updated with cleanup) =====
import { Component } from '../main';

/**
 * Router class for handling client-side routing in a single-page application.
 * Manages route registration, navigation, and component rendering based on URL changes.
 * 
 * @example
 * ```typescript
 * const router = new Router('app-container');
 * router.addRoute('/', () => new HomeComponent());
 * router.addRoute('/about', () => new AboutComponent());
 * router.start();
 * ```
 */
export class Router {
  /** Static 404 component to render for unmatched routes */
  static NotFoundComponent: Component | null = null;
  /** Array storing route patterns, regex, param names, and their corresponding component factory functions */
  private routes: Array<{
    pattern: string;
    regex: RegExp;
    paramNames: string[];
    componentFactory: (params?: Record<string, string>) => Component;
  }> = [];
  
  /** Current active route path */
  private currentRoute: string = '';
  
  /** DOM container element where components will be rendered */
  private container: HTMLElement;

  /** Track the currently mounted component for cleanup */
  private currentComponent: Component | null = null;

  /** Optional cleanup callback from App */
  private cleanupCallback?: () => void;

  /**
   * Handles browser back/forward button navigation (popstate events).
   * Updates the current route and re-renders the appropriate component.
   * 
   * @private
   * @returns {void}
   */
  private handlePopState(): void {
    this.currentRoute = window.location.pathname;
    console.log('Router: Handling popstate, new route:', this.currentRoute);
    this.renderCurrentRoute();
  }

  /**
   * Creates a new Router instance.
   * 
   * @param {string} containerId - The ID of the DOM element where components will be rendered
   * @throws {Error} Throws an error if the container element is not found
   * 
   * @example
   * ```typescript
   * const router = new Router('app-root');
   * ```
   */
  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id '${containerId}' not found`);
    }
    this.container = container;
    window.addEventListener('popstate', this.handlePopState.bind(this));
  }

  /**
   * Set cleanup callback from App class
   */
  setCleanupCallback(callback: () => void): void {
    this.cleanupCallback = callback;
  }

  /**
   * Renders a component instance into the router's container.
   * Clears any existing content before mounting the new component.
   * 
   * @private
   * @param {Component} component - The component instance to render
   * @returns {void}
   * 
   * @example
   * ```typescript
   * this.render(new HomeComponent());
   * ```
   */
  private render(component: Component): void {
    //  CLEANUP: Unmount previous component before mounting new one
    if (this.currentComponent && this.currentComponent.isMountedComponent()) {
      console.log('Router: Unmounting previous component');
      this.currentComponent.unmount();
    }

    if (this.cleanupCallback) {
      this.cleanupCallback();
    }

    this.container.innerHTML = '';
    component.mount(this.container);
    
    this.currentComponent = component;
    
    // console.log('Router: Mounted new component for route:', this.currentRoute);
  }

  /**
   * Renders the component associated with the current route.
   * If no matching route is found, no component is rendered.
   * 
   * @private
   * @returns {void}
   */
  private renderCurrentRoute(): void {
    let matched = false;
    for (const route of this.routes) {
      const match = route.regex.exec(this.currentRoute);
      if (match) {
        matched = true;
        // Extract params
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, idx) => {
          params[name] = match[idx + 1];
        });
        const component = route.componentFactory(params);
        this.render(component);
        break;
      }
    }
    if (!matched) {
      console.warn(`No route found for path: ${this.currentRoute}`);
      if (Router.NotFoundComponent) {
        this.render(Router.NotFoundComponent);
      } else {
        if (this.currentComponent && this.currentComponent.isMountedComponent()) {
          this.currentComponent.unmount();
          this.currentComponent = null;
        }
      }
    }
  }

  /**
   * Initializes the router by setting the current route from the URL
   * and rendering the appropriate component.
   * This method should be called after all routes have been registered.
   * 
   * @returns {void}
   * 
   * @example
   * ```typescript
   * router.addRoute('/', () => new HomeComponent());
   * router.addRoute('/about', () => new AboutComponent());
   * router.start(); // Start the router
   * ```
   */

  start(): void {
    this.currentRoute = window.location.pathname || '/';
    this.renderCurrentRoute();
  }

  /**
   * Registers a route with its corresponding component factory function.
   */
  /**
   * Registers a route with its corresponding component factory function.
   * Supports dynamic params: /profile/:username
   */
  addRoute(pattern: string, componentFactory: (params?: Record<string, string>) => Component): void {
    const paramNames: string[] = [];
    // Escape special regex chars except /
    let regexStr = pattern.replace(/([.*+?^${}()|\[\]\\])/g, '\\$1');
    regexStr = regexStr.replace(/:(\w+)/g, function (_: string, name: string) {
      paramNames.push(name);
      return '([^/]+)';
    });
    regexStr = `^${regexStr}/?$`;
    const regex = new RegExp(regexStr);
    this.routes.push({
      pattern,
      regex,
      paramNames,
      componentFactory
    });
  }


  /**
   * Programmatically navigates to a specified route.
   * Updates the browser URL using the History API and renders the corresponding component.
   * If the target path is the same as the current route, no navigation occurs.
   * 
   * @param {string} path - The URL path to navigate to
   * @returns {void}
   * 
   * @example
   * ```typescript
   * // Navigate to home page
   * router.navigate('/');
   * 
   * // Navigate to user profile
   * router.navigate('/user/profile');
   * 
   * // Navigate with query parameters (stored in URL)
   * router.navigate('/search?q=javascript');
   * 
   * // Conditional navigation
   * if (user.isAuthenticated) {
   *   router.navigate('/dashboard');
   * } else {
   *   router.navigate('/login');
   * }
   * ```
   */
  navigate(path: string): void {
    if (path !== this.currentRoute) {
      this.currentRoute = path;
      history.pushState(null, '', path);
      this.renderCurrentRoute();
    }
  }

  getCurrentRoute(): string {
    return this.currentRoute;
  }

  /**
   * Cleanup method to be called when router is destroyed
   */
  destroy(): void {
    if (this.currentComponent && this.currentComponent.isMountedComponent()) {
      this.currentComponent.unmount();
      this.currentComponent = null;
    }

    if (this.cleanupCallback) {
      this.cleanupCallback();
    }

    window.removeEventListener('popstate', this.handlePopState.bind(this));
  }
}

