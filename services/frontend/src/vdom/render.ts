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
      // Component function
      const componentVNode = (vnode.type as ComponentFunction)(vnode.props);
      const element = this.createElement(componentVNode);
      vnode.element = element as HTMLElement;
      return element;
    }

    // Regular HTML element
    const element = document.createElement(vnode.type as string);
    vnode.element = element;

    // Set properties
    this.setProps(element, vnode.props);

    // Render children
    vnode.children.forEach(child => {
      const childElement = this.createElement(child);
      element.appendChild(childElement);
    });

    return element;
  }

  /**
   * CRITICAL FIX: Enhanced patch method that handles all patch types correctly
   */
  patch(container: HTMLElement, patches: PatchOperation[]): void {
    // console.log(`🔧 Applying ${patches.length} patches to container:`, container);
    
    patches.forEach((patch, index) => {
      // console.log(`📝 Patch ${index + 1}/${patches.length}:`, patch);
      
      switch (patch.type) {
        case 'CREATE':
          if (patch.vnode) {
            const newElement = this.createElement(patch.vnode);
            container.appendChild(newElement);
            // console.log(`✅ Created new element:`, newElement);
          }
          break;

        case 'REMOVE':
          if (patch.element && patch.element.parentNode) {
            patch.element.parentNode.removeChild(patch.element);
            // console.log(`🗑️ Removed element:`, patch.element);
          }
          break;

        case 'REPLACE':
          if (patch.vnode && patch.element && patch.element.parentNode) {
            const newElement = this.createElement(patch.vnode);
            patch.element.parentNode.replaceChild(newElement, patch.element);
            // console.log(`🔄 Replaced element:`, patch.element, 'with:', newElement);
          }
          break;

        case 'UPDATE':
          if (patch.element && patch.props) {
            if (patch.element instanceof Text) {
              // Update text content
              const oldText = patch.element.textContent;
              patch.element.textContent = patch.props.textContent;
              // console.log(`📝 Updated text from "${oldText}" to "${patch.props.textContent}"`);
            } else {
              // Update element properties
              // console.log(`📝 Updating props on element:`, patch.element, patch.props);
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
            // console.log(`✅ Created child element at index ${patch.index}:`, newElement);
          }
          break;

        case 'REMOVE_CHILD':
          if (patch.element && patch.parent && patch.parent.contains(patch.element)) {
            patch.parent.removeChild(patch.element);
            // console.log(`🗑️ Removed child element:`, patch.element);
          }
          break;

        default:
          console.warn(`⚠️ Unknown patch type:`, patch);
      }
    });
    
    console.log(`✅ Applied all ${patches.length} patches`);
  }

  private setProps(element: HTMLElement, props: VNodeProps): void {
    for (const key in props) {
      if (key === 'key') continue;

      const value = props[key];

      if (key === 'ref' && typeof value === 'function') {
        value(element);
        continue;
      }

      if (key.startsWith('on') && typeof value === 'function') {
        // CRITICAL FIX: Remove old event listeners before adding new ones
        const eventType = key.slice(2).toLowerCase();
        
        // Remove existing listener if it exists
        const existingListener = (element as any)[`__${key}`];
        if (existingListener) {
          element.removeEventListener(eventType, existingListener);
        }
        
        // Add new listener and store reference
        element.addEventListener(eventType, value);
        (element as any)[`__${key}`] = value;
        // console.log(`🎯 Added event listener: ${eventType} to`, element);
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

      if (value === null || value === undefined) {
        element.removeAttribute(key);
      } else {
        element.setAttribute(key, String(value));
      }
    }
  }
}