import { CounterExample } from "../components/examples/Counter"; 
import { PongLoginPage } from "../components/Auth/LoginForm";
import { CounterClassComponent } from "../components/examples/ClassComp";

import { Router } from "../utils/router";
import { Component } from "./Component";
import { ComponentFunction, ComponentProps, VNode } from "../types/global";
import { HooksManager } from "../hooks/HooksManager";
import { Renderer } from "../vdom/render";
import { createElement as h } from "../vdom/createElement";
import PerformanceOptimizer from "./PerformanceOptimizer";

import { useState } from "../hooks/useState";
import { useEffect } from "../hooks/useEffect";
import { useMemo } from "../hooks/useMemo";
import { useRef } from "../hooks/useRef";
import { useCallback } from "../hooks/useCallback";
import { AuthForm } from "../components/examples/AuthForm";
import { Welcome } from "../components/examples/Welcome";


import { Home } from "../components/home/Home";


import { SettingsPage } from '../components/settings/SettingsPage';
import { isJSDocAuthorTag } from "typescript";




interface AppConfig {
  containerId: string;
  enableDevTools?: boolean;
  enablePerformanceMonitoring?: boolean;
  cacheSize?: number;
}

interface AppState {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  currentRoute: string;
}

export class App {
  private router: Router;
  private config: AppConfig;
  private state: AppState;
  private performanceMonitor?: () => void;
  private hooksManager: HooksManager;
  private renderer: Renderer;
 
  private activeComponents: Component[] = [];

  constructor(config: AppConfig = { containerId: "app" }) {
    this.config = {
      enableDevTools: import.meta.env.MODE === "development",
      enablePerformanceMonitoring: true,
      cacheSize: 1000,
      ...config,
    };

    this.state = {
      initialized: false,
      loading: false,
      error: null,
      currentRoute: "/",
    };

    this.hooksManager = HooksManager.getInstance();
    this.renderer = Renderer.getInstance();
    this.router = new Router(this.config.containerId);
    this.router.setCleanupCallback(() => this.cleanupActiveComponents());

  }

  async start(): Promise<void> {
    if (this.state.initialized) {
      console.warn("App already initialized");
      return;
    }

    this.state.loading = true;

    try {
      // Setup routing
      this.setupRoutes();

      // Setup performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        this.setupPerformanceMonitoring();
      }

      // Setup development tools
      if (this.config.enableDevTools) {
        this.setupDevTools();
      }

      // Start the router
      this.router.start();
      this.state.currentRoute = this.router.getCurrentRoute();

      this.state = {
        ...this.state,
        initialized: true,
        loading: false,
        error: null,
      };

      console.log("Application started successfully");
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : "Unknown error";
      this.state.loading = false;

      console.error("Application startup failed:", error);
      this.renderErrorState();
    }
  }

  async stop(): Promise<void> {
    console.log("Stopping application...");

    // Stop performance monitoring
    if (this.performanceMonitor) {
      this.performanceMonitor();
    }

    // Cancel any pending updates
    PerformanceOptimizer.cancelUpdates();

    //  CLEANUP: Destroy router and cleanup components
    this.router.destroy();
    this.cleanupActiveComponents();

    // Cleanup services
    try {
      await this.cleanupServices();
    } catch (error) {
      console.error("App stop failed:", error);
    }

    // Reset state
    this.state = {
      initialized: false,
      loading: false,
      error: null,
      currentRoute: "/",
    };
  }



  private async cleanupServices(): Promise<void> {
    // Cleanup user store
    try{
      console.log("i am in cleanupSrevices\n")
      // await UserStore.cleanup?.();
    } catch (error) {
      console.warn("Service cleanup error:", error);
      // Continue cleanup even if one service fails
    }
    

    // Cleanup other services
    // await ApiService.cleanup();
  }


/**
 * Creates a class component instance and returns it
 * The router will handle mounting/unmounting the component
 * 
 * @param ComponentClass - The class component constructor
 * @param props - Props to pass to the component
 * @returns Component instance that the router can manage
 */
private createClassComponent<P extends ComponentProps>(
  ComponentClass: new (props: P) => Component<P>,
  props: P = {} as P
): Component<P> {
  // Create component instance
  const componentInstance = new ComponentClass(props);
  
  // Store reference for cleanup (optional, depends on your router implementation)
  this.trackComponentForCleanup?.(componentInstance);
  
  return componentInstance;
}

/**
 *  ENHANCED: Creates a functional component wrapper with Virtual DOM support
 * This gives functional components the same benefits as class components
 */
private createFunctionalComponent<P = any>(
  componentFn: ComponentFunction<P>,
  props: P = {} as P
): Component {
  const appRenderer = this.renderer;
  const hooksManager = this.hooksManager;

  class FunctionalWrapper extends Component {
    private _currentVNode: VNode | null = null;

    render(): VNode {
      // Set the current component context for hooks
      hooksManager.setCurrentComponent(this);

      try {
        // Call the functional component and get the VNode
        const vnode = componentFn(props);
        
        console.log(" FUNCTIONAL COMPONENT: Generated VNode", vnode);
        
        // Return the VNode directly - this triggers Virtual DOM path in Component.ts
        return vnode;
      } finally {
        // Component.ts will handle clearing the component context
        // hooksManager.clearCurrentComponent();
      }
    }

    protected setState(newState: any, callback?: () => void): void {
      super.setState(newState, callback);
    }

    componentDidMount(): void {
      console.log("FUNCTIONAL COMPONENT: Mounted");
    }

    componentDidUpdate(): void {
      console.log("FUNCTIONAL COMPONENT: Updated");
    }

    componentWillUnmount(): void {
      console.log("FUNCTIONAL COMPONENT: Will unmount");
    }
  }

  return new FunctionalWrapper();
}


private trackComponentForCleanup(component: Component): void {
  this.activeComponents.push(component);
}

/**
 * Optional: Cleanup method to call when route changes
 */
private cleanupActiveComponents(): void {
  this.activeComponents.forEach(component => {
    if (component.isMountedComponent()) {
      component.unmount();
    }
  });
  this.activeComponents = [];
}

/**
 *  ENHANCED: Updated setupRoutes method with Virtual DOM for functional components
 */
private setupRoutes(): void {
  console.log("Setting up routes...");
  
  this.router.addRoute("/counter", () =>
    this.createFunctionalComponent(CounterExample, { initialCount: 1 })
  );


// this.router.addRoute("/home", () =>
//   this.createClassComponent(CounterClassComponent, { initialCount: 1 })
// );

// Router configuration
this.router.addRoute('/settings', () => 
  this.createFunctionalComponent(SettingsPage, { defaultTab: 'profile' })
);

this.router.addRoute('/settings/profile', () => 
  this.createFunctionalComponent(SettingsPage, { defaultTab: 'profile' })
);

this.router.addRoute('/settings/friends', () => 
  this.createFunctionalComponent(SettingsPage, { defaultTab: 'friends' })
);

this.router.addRoute('/settings/matchHistory', () => 
  this.createFunctionalComponent(SettingsPage, { defaultTab: 'matchHistory' })
);

this.router.addRoute('/settings/overview', () => 
  this.createFunctionalComponent(SettingsPage, { defaultTab: 'overview' })
);


 this.router.addRoute("/login", () => 
  this.createFunctionalComponent(AuthForm)
);
   this.router.addRoute("/", () => 
  this.createFunctionalComponent(Welcome)
);

    

   this.router.addRoute("/home", () => 
  this.createFunctionalComponent(Home)
);
  
  this.router.addRoute("/pinlog", () =>
    this.createFunctionalComponent(PongLoginPage)
  );

  console.log("Routes configured");
}

  private createPlaceholderComponent(name: string): Component {
    class PlaceholderComponent extends Component {
      render(): HTMLElement {
        const container = document.createElement("div");
        container.className = "placeholder-component p-8 text-center";
        container.innerHTML = `
          <h1 class="text-3xl font-bold mb-4">${name} REgex Page</h1>
          <p class="text-gray-600">This is a placeholder for the ${name} component.</p>
          <p class="text-sm text-gray-500 mt-4">Replace this with your actual ${name} component.</p>
        `;
        return container;
      }
    }
    return new PlaceholderComponent();
  }



  private setupPerformanceMonitoring(): void {
    this.performanceMonitor = PerformanceOptimizer.startMonitoring(30000); // 30 seconds

    // Log performance metrics periodically in development
    if (this.config.enableDevTools) {
      setInterval(() => {
        const metrics = PerformanceOptimizer.getMetrics();
        if (metrics.updateCount > 0) {
          console.group("🔍 Performance Metrics");
          console.table(metrics);
          console.groupEnd();
        }
      }, 60000); // Every minute
    }
  }




  private setupDevTools(): void {
    (window as any).__FRAMEWORK_DEVTOOLS__ = {
      app: this,
      router: this.router,
      hooksManager: this.hooksManager,
      renderer: this.renderer,
      performanceOptimizer: PerformanceOptimizer,

      // Utility functions
      getState: () => console.table(this.state),
      getConfig: () => console.table(this.config),
      getMetrics: () => console.table(PerformanceOptimizer.getMetrics()),
      clearCache: () => PerformanceOptimizer.clearMemoCache(),
      restart: () => this.restart(),

      debug: {
        enableVerboseLogging: () => {
          (window as any).__FRAMEWORK_DEBUG__ = true;
        },
        triggerUpdate: () => {
          PerformanceOptimizer.scheduleUpdate(() => {
            console.log("Manual update triggered");
          });
        },
        inspectComponent: (component: any) => {
          console.log("Component inspection:", {
            hooks: this.hooksManager.getCurrentComponentHooks(),
            element: component.element,
            state: component.state,
            props: component.props,
          });
        },
      },
    };

    console.log(
      "🔧 Development tools available at window.__FRAMEWORK_DEVTOOLS__"
    );
    console.log("🐛 Available commands:");
    console.log(
      "  - __FRAMEWORK_DEVTOOLS__.getMetrics() - Get performance metrics"
    );
    console.log(
      "  - __FRAMEWORK_DEVTOOLS__.clearCache() - Clear memoization cache"
    );
    console.log("  - __FRAMEWORK_DEVTOOLS__.restart() - Restart application");
    console.log("  - __FRAMEWORK_DEVTOOLS__.debug.* - Debug utilities");
    console.log("     ---> enableVerboseLogging");
    console.log("     ---> triggerUpdate");
    console.log("     ---> inspectComponent(component: any)");
  }

  async restart(): Promise<void> {
    console.log("🔄 Restarting application...");
    await this.stop();
    await this.start();
  }

  private renderErrorState(): void {
    const container = document.getElementById(this.config.containerId);
    if (container) {
      container.innerHTML = `
        <div class="error-state p-8 text-center bg-red-50 border border-red-200 rounded-lg">
          <h1 class="text-2xl font-bold text-red-800 mb-4">Application Error</h1>
          <p class="text-red-700 mb-4">${this.state.error}</p>
          <button 
            onclick="location.reload()" 
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      `;
    }
  }

  getState(): AppState {
    return { ...this.state };
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }
}

export default App;