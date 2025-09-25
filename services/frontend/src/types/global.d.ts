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
  element?: HTMLElement | Text | null;
}

export type VNodeType = string | ComponentFunction | 'TEXT_NODE';

export interface VNodeProps {
  [key: string]: any;
  // children?: VNode[];
  key?: string | number;
  // ref?: {current: HTMLElement | null};
}

export type ComponentFunction<P = VNodeProps> = (props: P) => VNode ;

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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
