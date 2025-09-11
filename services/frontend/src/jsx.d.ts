// src/jsx.d.ts
import { VNode, VNodeProps } from "./types/global";
import { Fragment } from "./vdom/createElement";

// Tell TS that whenever it sees <foo ...> it produces a VNode
declare global {
  namespace JSX {
    // what each JSX expression yields
    type Element = VNode;

    // allow any tag name, with any props
    interface IntrinsicElements {
      [elemName: string]: VNodeProps & { children?: any };
    }

    // if you ever do <Component foo={…}/>
    interface ElementAttributesProperty {
      props: {};
    }

    // for fragments: <>…</>
    interface IntrinsicElements {
      fragment: {};
    }
  }
}