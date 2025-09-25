import { VirtualDOM } from "./diff";
import { ComponentFunction, PatchOperation, VNode, VNodeProps } from "../types/global";

/**
 * Renderer class responsible for converting virtual DOM nodes to real DOM elements
 * and applying patch operations to update the DOM efficiently.
 */
export class Renderer {
  /** prevent instantiation from other classses  */
  private constructor() { }
  /** Singleton instance of the Renderer */
  private static instance: Renderer;
  
  /** Virtual DOM instance for coordinated operations */
  private vdom = VirtualDOM.getInstance();

  /**
   * Gets the singleton instance of Renderer.
   */
  static getInstance(): Renderer {
    if (!Renderer.instance) {
      Renderer.instance = new Renderer();
    }
    return Renderer.instance;
  }

  /**
   * Creates a real DOM element from a virtual DOM node.
   * CRITICAL FIX: Properly handles element reference assignment
   */
  createElement(vnode: VNode): HTMLElement | Text {
    if (vnode.type === 'TEXT_NODE') {
      const textNode = document.createTextNode(vnode.props.textContent || '');
      vnode.element = textNode as Text;
      return textNode;
    }

    if (typeof vnode.type === 'function') {
      const componentVNode = (vnode.type as ComponentFunction)(vnode.props);
      const element = this.createElement(componentVNode);
      vnode.element = element as HTMLElement;
      return element;
    }

    const element = document.createElement(vnode.type as string);
    vnode.element = element;

    this.setProps(element, vnode.props);

    vnode?.children?.forEach(child => {
      const childElement = this.createElement(child);
      element.appendChild(childElement);
    });

    return element;
  }

  /**
   * CRITICAL FIX: Enhanced patch method that handles all patch types correctly
   */
  patch(container: HTMLElement, patches: PatchOperation[]): void {
    
    patches.forEach((patch, index) => {
      
      switch (patch.type) {
        case 'CREATE':
          if (patch.vnode) {
            const newElement = this.createElement(patch.vnode);
            container.appendChild(newElement);
          }
          break;

        case 'REMOVE':
          if (patch.element && patch.element.parentNode) {
            patch.element.parentNode.removeChild(patch.element);
          }
          break;

        case 'REPLACE':
          if (patch.vnode && patch.element && patch.element.parentNode) {
            const newElement = this.createElement(patch.vnode);
            patch.element.parentNode.replaceChild(newElement, patch.element);
          }
          break;

        case 'UPDATE':
          if (patch.element && patch.props) {
            if (patch.element instanceof Text) {
              patch.element.textContent = patch.props.textContent;
            } else {
              this.setProps(patch.element as HTMLElement, patch.props);
            }
          }
          break;

        case 'CREATE_CHILD':
          if (patch.vnode && patch.parent) {
            const newElement = this.createElement(patch.vnode);
            if (patch.index !== undefined && patch.index < patch.parent.children.length) {
              patch.parent.insertBefore(newElement, patch.parent.children[patch.index]);
            } else {
              patch.parent.appendChild(newElement);
            }
          }
          break;

        case 'REMOVE_CHILD':
          if (patch.element && patch.parent && patch.parent.contains(patch.element)) {
            patch.parent.removeChild(patch.element);
          }
          break;

        default:
          console.warn(`Unknown patch type:`, patch);
      }
    });
    
  }


  private setProps(element: HTMLElement, props: VNodeProps): void {
    for (const key in props) {
      if (key === 'key') continue;

      const value = props[key];

      // ===== THIS BLOCK IS THE FIX =====
      if (key === 'ref') {
        if (typeof value === 'function') {
          // Handles callback refs: ref={(el) => ...}
          value(element);
        } else if (value && typeof value === 'object' && 'current' in value) {
          // Handles object refs from useRef: ref={myRef}
          value.current = element;
        }
        continue; // Skip setting 'ref' as an HTML attribute
      }
      // =================================

      if (key.startsWith('on') && typeof value === 'function') {
        const eventType = key.slice(2).toLowerCase();
        
        const existingListener = (element as any)[`__${key}`];
        if (existingListener) {
          element.removeEventListener(eventType, existingListener);
        }
        
        element.addEventListener(eventType, value);
        (element as any)[`__${key}`] = value;
        continue;
      }

      if (key === 'className') {
        element.className = value || '';
        continue;
      }

      if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
        continue;
      }

      if (key === 'value' && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
        if (element.value !== value) {
          element.value = value || '';
        }
        continue;
      }

      if (value === null || value === undefined) {
        element.removeAttribute(key);
        if (key === 'value' && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
          element.value = '';
        }
      } else {
        element.setAttribute(key, String(value));
      }
    }
  }
}