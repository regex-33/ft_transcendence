import { PatchOperation, VNode } from "../types/global";
import { logDiffComparison } from '../utils/logVnodes';

/**
 * Virtual DOM implementation that provides efficient diffing between virtual node trees.
 * Uses a singleton pattern to ensure consistent state across the application.
 * 
 * The VirtualDOM class implements a tree diffing algorithm that compares old and new
 * virtual DOM trees and generates a minimal set of patch operations to update the real DOM.
 */
export class VirtualDOM {
  /** prevent instantiation from other classses  */
  private constructor() { }
  /** Singleton instance of the VirtualDOM */
  private static instance: VirtualDOM;
  
  /** Queue of patch operations generated during the diffing process */
  private patchQueue: PatchOperation[] = [];

  /**
   * Gets the singleton instance of VirtualDOM.
   * Creates a new instance if one doesn't exist.
   */
  static getInstance(): VirtualDOM {
    if (!VirtualDOM.instance) {
      VirtualDOM.instance = new VirtualDOM();
    }
    return VirtualDOM.instance;
  }

  /**
   * Compares two virtual DOM trees and generates a list of patch operations
   * needed to transform the old tree into the new tree.
   */
  diff(oldVNode: VNode | null, newVNode: VNode | null): PatchOperation[] {
    this.patchQueue = [];
    // console.log("+-------------------------");
    // console.log("-- Diffing Virtual DOM --");
    logDiffComparison(oldVNode, newVNode);
    // console.log("Old VNode:", oldVNode);
    // console.log("New VNode:", newVNode);
    // console.log("+-------------------------");
    this.diffNodes(oldVNode, newVNode);
    // console.log("Patch Queue Length:", this.patchQueue.length);
    // console.log("Patch Queue:", this.patchQueue);
    return [...this.patchQueue];
  }

  /**
   * Recursively compares two virtual nodes and generates appropriate patch operations.
   * Handles all cases: creation, removal, replacement, and updates.
   */
  private diffNodes(oldVNode: VNode | null, newVNode: VNode | null): void {
    
    // Case 1: New node created
    if (!oldVNode && newVNode) {
      this.patchQueue.push({ type: 'CREATE', vnode: newVNode });
      return;
    }

    // Case 2: Node removed
    if (oldVNode && !newVNode) {
      this.patchQueue.push({ type: 'REMOVE', element: oldVNode.element as HTMLElement });
      return;
    }

    // Case 3: Both are null - nothing to do
    if (!oldVNode && !newVNode) {
      return;
    }

    // CRITICAL FIX: At this point both nodes exist
    if (!oldVNode || !newVNode) return; // TypeScript guard

    // Case 4: Node type changed - replace entire subtree
    if (oldVNode.type !== newVNode.type) {
      this.patchQueue.push({ 
        type: 'REPLACE', 
        vnode: newVNode,
        element: oldVNode.element as HTMLElement 
      });
      return;
    }

    // Case 5: Text node content changed
    if (newVNode.type === 'TEXT_NODE') {
      if (oldVNode.props.textContent !== newVNode.props.textContent) {
        this.patchQueue.push({
          type: 'UPDATE',
          element: oldVNode.element as Text,
          props: { textContent: newVNode.props.textContent }
        });
      }
      // CRITICAL FIX: Preserve the element reference
      newVNode.element = oldVNode.element;
      return;
    }

    // Case 6: Element props changed
    this.diffProps(oldVNode, newVNode);

    // Case 7: Children changed
    this.diffChildren(oldVNode, newVNode);

    // CRITICAL FIX: Preserve the element reference for future diffs
    newVNode.element = oldVNode.element;
  }

  /**
   * Compares the properties of two virtual nodes and generates update patches
   * for any changed, added, or removed properties.
   */
  private diffProps(oldVNode: VNode, newVNode: VNode): void {
    const oldProps = oldVNode.props || {};
    const newProps = newVNode.props || {};
    const propsToUpdate: { [key: string]: any } = {};
    let hasChanges = false;

    // Check for changed/new props
    for (const key in newProps) {
      if (key === 'children' || key === 'key') continue;
      
      if (oldProps[key] !== newProps[key]) {
        propsToUpdate[key] = newProps[key];
        hasChanges = true;
        // console.log(`🔧 Prop changed: ${key} from "${oldProps[key]}" to "${newProps[key]}"`);
      }
    }

    // Check for removed props
    for (const key in oldProps) {
      if (key === 'children' || key === 'key') continue;
      
      if (!(key in newProps)) {
        propsToUpdate[key] = null;
        hasChanges = true;
        console.log(`🗑️ Prop removed: ${key}`);
      }
    }

    if (hasChanges) {
      this.patchQueue.push({
        type: 'UPDATE',
        element: oldVNode.element as HTMLElement,
        props: propsToUpdate
      });
    }
  }

  /**
   * Compares the children of two virtual nodes and recursively diffs each child.
   * CRITICAL FIX: Properly handles child diffing with element reference preservation
   */
  // NEW VNODE TREE
// const newVNode = {
//   type: 'div',
//   props: { className: 'counter-example p-6 bg-white rounded-lg shadow-lg' },
//   children: [
//     {
//       type: 'h2',
//       props: { className: 'text-2xl font-bold mb-4' },
//       children: [{ type: 'TEXT_NODE', props: { textContent: 'Class Component Counter' } }]
//     },
//     {
//       type: 'div',
//       props: { className: 'text-center mb-4' },
//       children: [
//         {
//           type: 'span',
//           props: { className: 'text-4xl font-mono' },
//           children: [{ type: 'TEXT_NODE', props: { textContent: '1' } }] // ← NEW VALUE
//         }
//       ]
//     },
//     {
//       type: 'div',
//       props: { className: 'flex gap-2 justify-center mb-4' },
//       children: [/* same buttons */]
//     },
//     {
//       type: 'div',
//       props: { className: 'text-sm text-gray-600' },
//       children: [
//         {
//           type: 'p',
//           children: [{ type: 'TEXT_NODE', props: { textContent: 'History: 1' } }] // ← NEW HISTORY
//         },
//         {
//           type: 'p',
//           children: [{ type: 'TEXT_NODE', props: { textContent: 'Average: 1.00' } }] // ← NEW AVERAGE
//         }
//       ]
//     }
//   ]
// }
  private diffChildren(oldVNode: VNode, newVNode: VNode): void {
    const oldChildren = oldVNode.children || [];
    // console.log('--- Old Children ---');
    // oldChildren.forEach((child, index) => {
    //   console.log(`Child ${index}:`, child);
    // });
    // console.log('---------------------');
    const newChildren = newVNode.children || [];
    // console.log('--- New Children ---');
    // newVNode.children?.forEach((child, index) => {
    //   console.log(`Child ${index}:`, child);
    // });
    // console.log('---------------------');

    const maxLength = Math.max(oldChildren.length, newChildren.length);
    // console.log(`🔍 Diffing children: old=${oldChildren.length}, new=${newChildren.length}, max=${maxLength}`);

    for (let i = 0; i < maxLength; i++) {
      const oldChild = oldChildren[i] || null;
      const newChild = newChildren[i] || null;

      if (!oldChild && newChild) {
        this.patchQueue.push({ 
          type: 'CREATE_CHILD', 
          vnode: newChild,
          parent: oldVNode.element as HTMLElement,
          index: i
        });
        continue;
      }

      // CRITICAL FIX: Handle child removals  
      if (oldChild && !newChild) {
        this.patchQueue.push({ 
          type: 'REMOVE_CHILD', 
          element: oldChild.element as HTMLElement | Text,
          parent: oldVNode.element as HTMLElement 
        });
        continue;
      }

      // Both children exist - recurse
      if (oldChild && newChild) {
        this.diffNodes(oldChild, newChild);
      }
    }
  }
}