import { VNode, VNodeProps, VNodeType } from "../types/global";

export function createElement(
  type: VNodeType,
  props: VNodeProps | null = null,
  ...children: (VNode | string | number | boolean | null | undefined)[]
): VNode {

  if (typeof type === "function") {
    return type({ ...props, children }); // this triggers hook registration
  }
  // console.log('Creating element:', type, props, children);
    // .flat() => this flattens only one level, for deeply nested arrayes i use infinity
  const normalizedChildren: VNode[] = children
    .flat(Infinity)
    .filter(child => child != null && typeof child !== 'undefined' && typeof child !== 'boolean')
    .map(child => {
      if (typeof child === 'string' || typeof child === 'number') {
        return createTextNode(String(child));
      }
      return child as VNode;
    });

  return {
    type,
    props: props || {},
    children: normalizedChildren,
    key: props?.key
  };
}

export function createTextNode(text: string): VNode {
  return {
    type: 'TEXT_NODE',
    props: { textContent: text },
    children: []
  };
}

export const h = createElement;