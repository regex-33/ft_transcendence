export interface ComponentProps {
  [key: string]: any;
}

export interface ComponentState {
  [key: string]: any;
}

export interface PatchOperation {
  type: 'CREATE' | 'REMOVE' | 'REPLACE' | 'UPDATE' | 'CREATE_CHILD' | 'REMOVE_CHILD';
  vnode?: VNode;
  element?: HTMLElement | Text;
  parent?: HTMLElement;
  index?: number;
  props?: { [key: string]: any };
}

export interface VNode {
  type: VNodeType;
  props: VNodeProps;
  children: VNode[];
  key?: string | number;
  element?: HTMLElement | Text | null; // DOM reference : vdom Element -> dom element
}

export type VNodeType = string | ComponentFunction | 'TEXT_NODE';

export interface VNodeProps {
  [key: string]: any;
  // children?: VNode[];
  key?: string | number;
  // ref?: (element: HTMLElement | null) => void;
}

export type ComponentFunction = (props: VNodeProps) => VNode;



declare const process: {
  env: {
    NODE_ENV: 'development' | 'production';
  };
};

export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  wins: number;
  losses: number;
  rank?: number;
  friends?: User[];
}

export interface GameState {
  player1Score: number;
  player2Score: number;
  gameRunning: boolean;
  ballX: number;
  ballY: number;
  paddle1Y: number;
  paddle2Y: number;
}

export interface RouteConfig {
  path: string;
  component: () => Component;
  requiresAuth?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===== src/vdom/types.ts =====
// export type VNodeType = string | Function;





declare global {
  interface Window {
    // Framework globals
    Framework: {
      createElement: typeof h;
      Component: typeof Component;
      useState: typeof useState;
      useEffect: typeof useEffect;
      useMemo: typeof useMemo;
      useRef: typeof useRef;
      useCallback: typeof useCallback;
      render: (component: VNode | ComponentFunction, container: HTMLElement) => void;
    };
    // App globals
    userStore: typeof userStore;
    router: Router;
  }
}


// export type ComponentFunction = (props: any) => VNode;

// interface AuthResponse {
//   success: boolean;
//   message?: string;
//   user?: {
//     id: string;
//     email: string;
//   };
// }

// declare global {
//   interface Window {
//     userStore: g{
//       isLoggedIn: boolean;
//       currentUser: null | {
//         id: string;
//         email: string;
//       };
//     };
//     navigate: (path: string) => void;
//   }
// }
