import { VNode } from "../types/global";

/**
 * Utility function to format VNode objects into a readable, formatted string
 * similar to JavaScript object literal syntax with proper indentation.
 */
export function formatVNode(vnode: VNode | null, indent: number = 0): string {
  if (!vnode) {
    return 'null';
  }

  const spaces = '  '.repeat(indent);
  const nextIndent = indent + 1;
  const nextSpaces = '  '.repeat(nextIndent);

  let result = '{\n';
  
  // Type
  result += `${nextSpaces}type: '${vnode.type}',\n`;
  
  // Props
  if (vnode.props && Object.keys(vnode.props).length > 0) {
    result += `${nextSpaces}props: `;
    result += formatProps(vnode.props, nextIndent);
    result += ',\n';
  }
  
  // Children
  if (vnode.children && vnode.children.length > 0) {
    result += `${nextSpaces}children: [\n`;
    
    vnode.children.forEach((child, index) => {
      const childIndent = nextIndent + 1;
      const childSpaces = '  '.repeat(childIndent);
      
      result += `${childSpaces}${formatVNode(child, childIndent)}`;
      
      if (index < vnode.children.length - 1) {
        result += ',';
      }
      result += '\n';
    });
    
    result += `${nextSpaces}]\n`;
  }
  
  result += `${spaces}}`;
  
  return result;
}

/**
 * Helper function to format props object
 */
function formatProps(props: any, indent: number): string {
  const spaces = '  '.repeat(indent);
  const nextSpaces = '  '.repeat(indent + 1);
  
  if (!props || typeof props !== 'object') {
    return JSON.stringify(props);
  }
  
  // Filter out children from props display
  const filteredProps = { ...props };
  delete filteredProps.children;
  
  const keys = Object.keys(filteredProps);
  if (keys.length === 0) {
    return '{}';
  }
  
  let result = '{\n';
  
  keys.forEach((key, index) => {
    const value = filteredProps[key];
    result += `${nextSpaces}${key}: `;
    
    if (typeof value === 'string') {
      result += `'${value}'`;
    } else {
      result += JSON.stringify(value);
    }
    
    if (index < keys.length - 1) {
      result += ',';
    }
    result += '\n';
  });
  
  result += `${spaces}}`;
  
  return result;
}

/**
 * Enhanced console logging function for VNodes
 */
export function logVNode(vnode: VNode | null, label: string = 'VNode'): void {
  console.log(`// ${label.toUpperCase()}`);
  console.log(`const ${label.toLowerCase().replace(/\s+/g, '')} = ${formatVNode(vnode)};`);
}

/**
 * Usage example for your diff method:
 */
export function logDiffComparison(oldVNode: VNode | null, newVNode: VNode | null): void {
  if (oldVNode) {
    logVNode(oldVNode, 'OLD VNODE TREE');
  } else {
    console.log('// OLD VNODE TREE\nconst oldVNode = null;');
  }
  
  console.log('');
  
  if (newVNode) {
    logVNode(newVNode, 'NEW VNODE TREE');
  } else {
    console.log('// NEW VNODE TREE\nconst newVNode = null;');
  }
}

/**
 * Alternative compact formatter for simpler output
 */
export function formatVNodeCompact(vnode: VNode | null): string {
  if (!vnode) return 'null';
  
  if (vnode.type === 'TEXT_NODE') {
    return `{ type: 'TEXT_NODE', props: { textContent: '${vnode.props.textContent}' } }`;
  }
  
  let result = `{ type: '${vnode.type}'`;
  
  if (vnode.props && Object.keys(vnode.props).filter(k => k !== 'children').length > 0) {
    const filteredProps = { ...vnode.props };
    delete filteredProps.children;
    result += `, props: ${JSON.stringify(filteredProps)}`;
  }
  
  if (vnode.children && vnode.children.length > 0) {
    result += `, children: [${vnode.children.length > 2 ? '/* ... */' : vnode.children.map(c => formatVNodeCompact(c)).join(', ')}]`;
  }
  
  result += ' }';
  return result;
}