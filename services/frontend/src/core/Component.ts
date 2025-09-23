import { ComponentProps, ComponentState, VNode } from "../types/global";
import { HooksManager } from "../hooks/HooksManager";
import { Renderer } from "../vdom/render";
import { PerformanceOptimizer } from "./PerformanceOptimizer";

// Hook imports for class component support
import { useState } from "../hooks/useState";
import { useEffect } from "../hooks/useEffect";
import { useMemo } from "../hooks/useMemo";
import { useRef } from "../hooks/useRef";
import { useCallback } from "../hooks/useCallback";

import { VirtualDOM } from "../vdom/diff";

export abstract class Component<
  P extends ComponentProps = {},
  S extends ComponentState = {}
> {
  protected element: HTMLElement;
  protected props: P;
  protected state: S;
  protected hooksManager = HooksManager.getInstance();
  
  // Virtual DOM support
  private renderer = Renderer.getInstance();
  private vdom = VirtualDOM.getInstance();
  private currentVNode: VNode | null = null;
  
  // private isVirtualDOM = false;
  private isMounted = false;
  private updateScheduled = false;

  constructor(props: P = {} as P) {
    this.props = props;
    this.state = {} as S;
    this.element = document.createElement("div");
  }

  abstract render(): HTMLElement | VNode;

  protected setState(newState: Partial<S>, callback?: () => void): void {
    const prevState = this.state;
    this.state = { ...this.state, ...newState };

    if (this.hasStateChanged(prevState, this.state)) {
      this.scheduleUpdate();
      if (callback) {
        PerformanceOptimizer.scheduleUpdate(callback);
      }
    }
  }

  private hasStateChanged(prev: S, next: S): boolean {
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);
    if (prevKeys.length !== nextKeys.length) return true;
    return prevKeys.some(
      (key) => !Object.is(prev[key as keyof S], next[key as keyof S])
      // (key) => !Object.is(prev[key], next[key])
    );
  }

  private scheduleUpdate(): void {
    if (!this.updateScheduled && this.isMounted) {
      this.updateScheduled = true;
      PerformanceOptimizer.scheduleUpdate(() => {
        this.updateScheduled = false;
        this.update();
      });
    }
  }

  protected update(): void {
    if (!this.isMounted) return;

    this.hooksManager.setCurrentComponent(this);

    try {
      const rendered = this.render();

      if (this.isVNode(rendered)) {
        this.renderVirtualDOMWithDiffing(rendered);
      } else {
        this.renderTraditionalDOM(rendered);
      }

      if ("componentDidUpdate" in this && typeof this.componentDidUpdate === "function") {
        this.componentDidUpdate();
      }
    } catch (error: unknown) {
      const err = error as Error;
      this.renderErrorState(err);
    } finally {
      this.hooksManager.clearCurrentComponent();
    }
  }

  private isVNode(rendered: any): rendered is VNode {
    return (
      rendered &&
      typeof rendered === "object" &&
      "type" in rendered &&
      "props" in rendered
    );
  }

  private renderVirtualDOMWithDiffing(newVNode: VNode): void {
    const container = this.element.parentNode as HTMLElement;
    if (!container) {
      // console.error("Component element has no parent node");
      return;
    }

    if (this.currentVNode === null) {

      const newElement = this.renderer.createElement(newVNode);

      if (newVNode.props.ref && typeof newVNode.props.ref === "object") {
        console.log("Setting ref for new VNode:", newVNode.props.ref);
        newVNode.props.ref.current = newElement; // <-- where domNode is the rendered element
      }

      if (!(newElement instanceof HTMLElement)) {
        console.error("Rendered VNode did not produce an HTMLElement");
        return;
      }

      container.replaceChild(newElement, this.element);
      this.element = newElement;
      this.currentVNode = newVNode;
      
      // console.log("FIRST VDOM RENDER: Replaced placeholder with actual element");
    } else {
      // Subsequent updates - use diffing
      // console.log("DIFFING: oldVNode exists, comparing...");
      // console.log("Old VNode:", this.currentVNode);
      // console.log("New VNode:", newVNode);
      
      const patches = this.vdom.diff(this.currentVNode, newVNode);
      // console.log("PATCHES GENERATED:", patches.length, patches);
        if (newVNode.props.ref && typeof newVNode.props.ref === "object") {
                  console.log("Setting ref for existing VNode:", newVNode.props.ref);

        newVNode.props.ref.current = this.element; // <-- where domNode is the rendered element
      }
      if (patches.length > 0) {
        this.renderer.patch(this.element, patches);
      }
      
      this.currentVNode = newVNode;
    }
    
    // this.isVirtualDOM = true;
  }

  private renderTraditionalDOM(element: HTMLElement): void {
    if (this.element.parentNode) {
      this.element.parentNode.replaceChild(element, this.element);
    }
    this.element = element;
    // this.isVirtualDOM = false;
  }

  mount(container: HTMLElement): void {
    if (this.isMounted) {
      console.warn("Component is already mounted");
      return;
    }

    this.hooksManager.setCurrentComponent(this);

    try {
      if ("componentWillMount" in this && typeof this.componentWillMount === "function") {
        this.componentWillMount();
      }

      const rendered = this.render();

      if (this.isVNode(rendered)) {
        const placeholderDiv = document.createElement('div');
        placeholderDiv.style.display = 'contents'; // Make it invisible in layout
        
        this.element = placeholderDiv;
        container.appendChild(this.element);
        
        // Now render the actual VNode - this will replace the placeholder
        this.currentVNode = null; // Ensure first render logic is used
        this.renderVirtualDOMWithDiffing(rendered);
        
      } else {
        // Traditional DOM element
        this.element = rendered;
        container.appendChild(this.element);
        // this.isVirtualDOM = false;
      }

      this.isMounted = true;

      if ("componentDidMount" in this && typeof this.componentDidMount === "function") {
        this.componentDidMount();
      }
    } catch (error) {
      console.error("Component mount error:", error);
      this.renderErrorState(error as Error);
      container.appendChild(this.element);
    } finally {
      this.hooksManager.clearCurrentComponent();
    }
  }

  unmount(): void {
    if (!this.isMounted) return;

    try {
      if ("componentWillUnmount" in this && typeof this.componentWillUnmount === "function") {
        this.componentWillUnmount();
      }

      this.hooksManager.cleanup(this);

      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }

      this.currentVNode = null;
      this.isMounted = false;
    } catch (error) {
      console.error("Component unmount error:", error);
    }
  }

  private renderErrorState(error: Error): void {
    const errorElement = document.createElement("div");
    errorElement.className = "component-error";
    errorElement.innerHTML = `
      <div style="padding: 1rem; border: 1px solid #ff6b6b; background: #ffe0e0; border-radius: 4px;">
        <h3 style="margin: 0 0 0.5rem 0; color: #d63031;">Component Error</h3>
        <p style="margin: 0; font-size: 0.9rem; color: #2d3436;">${error.message}</p>
      </div>
    `;

    if (this.element.parentNode) {
      this.element.parentNode.replaceChild(errorElement, this.element);
    }
    this.element = errorElement;
  }

  protected forceUpdate(): void {
    if (this.isMounted) {
      this.update();
    }
  }

  protected getProps(): Readonly<P> {
    return Object.freeze({ ...this.props });
  }

  protected getState(): Readonly<S> {
    return Object.freeze({ ...this.state });
  }

  public isMountedComponent(): boolean {
    return this.isMounted;
  }

  protected addEventListener(
    element: HTMLElement,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): () => void {
    const boundHandler = handler.bind(this);
    element.addEventListener(event, boundHandler, options);

    // Return cleanup function
    return () => {
      element.removeEventListener(event, boundHandler, options);
    };
  }

  protected useState<T>(
    initialValue: T
  ): [T, (value: T | ((prev: T) => T)) => void] {
    // Make sure component context is set
    if (this.hooksManager.getCurrentComponent() !== this) {
      throw new Error("useState must be called during component render");
    }
    return useState(initialValue);
  }

  protected useEffect(effect: () => void | (() => void), deps?: any[]): void {
    if (this.hooksManager.getCurrentComponent() !== this) {
      throw new Error("useEffect must be called during component render");
    }
    return useEffect(effect, deps);
  }

  protected useMemo<T>(factory: () => T, deps: any[]): T {
    if (this.hooksManager.getCurrentComponent() !== this) {
      throw new Error("useMemo must be called during component render");
    }
    return useMemo(factory, deps);
  }

  protected useRef<T>(initialValue: T): { current: T } {
    if (this.hooksManager.getCurrentComponent() !== this) {
      throw new Error("useRef must be called during component render");
    }
    return useRef(initialValue);
  }

  protected useCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: any[]
  ): T {
    if (this.hooksManager.getCurrentComponent() !== this) {
      throw new Error("useCallback must be called during component render");
    }
    return useCallback(callback, deps);
  }

  protected componentWillMount?(): void;
  protected componentDidMount?(): void;
  protected componentDidUpdate?(): void;
  protected componentWillUnmount?(): void;
  protected shouldComponentUpdate?(nextProps: P, nextState: S): boolean;
}

export default Component;

