type MessageHandler = (data: any) => void;

type CloseHandler = (e: CloseEvent) => any;

export class Connection {
  private _socket: WebSocket | null = null;
  private _handlers = new Map<string, MessageHandler[]>();
  private _url: string;
  private _onClose: CloseHandler | null;
  public initialized: boolean;

  constructor(url: string, onClose: CloseHandler | null = null) {
    this._url = url;
    this._onClose = onClose;
    this.initialized = false;
  }

  onClose (callback: CloseHandler) {
    this._onClose = callback;
    const socket = this._socket;
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      return;
    }
    socket.onclose = callback;
  }

  connect(timeoutMs = 15000): Promise<void> {
    console.log("connecting to websocket");

    if (this._socket && (this._socket.readyState === WebSocket.OPEN || this._socket.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this._url);
      this._socket = socket;

      const timeout = setTimeout(() => {
        socket.close();
        if (this._socket === socket) {
          this._socket = null;
        }
        reject(new Error("WebSocket timeout"));
      }, timeoutMs);

      socket.onopen = () => {
        console.log("connected!!");
        if (this._onClose)
          socket.onclose = this._onClose;
        clearTimeout(timeout);
        resolve();
      };

      socket.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("WebSocket failed"));
      };

      socket.onmessage = (ev) => {
        let data;
        try {
          data = JSON.parse(ev.data);
        } catch (err) {
          console.log("cannot parse data:", err);
          return;
        }
        const type = data.type;
        const listeners = this._handlers.get(type) || [];
        for (const fn of listeners) fn(data);
      };
    });
  }

  send(data: any) {
    if (!this._socket || this._socket.readyState !== WebSocket.OPEN) {
      throw new Error("Cannot send message: socket is not open");
    }
    this._socket.send(JSON.stringify(data));
  }

  on(type: string, handler: MessageHandler) {
    if (!this._handlers.has(type)) this._handlers.set(type, []);
    this._handlers.get(type)!.push(handler);
  }

  once(type: string): Promise<any> {
    return new Promise((resolve) => {
      const handler = (data: any) => {
        this.off(type, handler);
        resolve(data);
      };
      this.on(type, handler);
    });
  }

  off(type: string, handler: MessageHandler) {
    const handlers = this._handlers.get(type);
    if (!handlers) return;
    this._handlers.set(
      type,
      handlers.filter((h) => h !== handler),
    );
  }

  close() {
    const socket = this._socket;
    if (!socket) {
      console.log("socket is null");
      return;
    }
    socket.close();
    this._socket = null;
    console.log("socket closed");
    socket.onmessage = null;
    socket.onerror = null;
    socket.onopen = null;
  }
}
