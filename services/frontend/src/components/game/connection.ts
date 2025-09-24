type MessageHandler = (data: any) => void;

export class Connection {
  private _socket!: WebSocket;
  private _handlers = new Map<string, MessageHandler[]>();
  private _url: string;
  public initialized: boolean;

  constructor(url: string) {
    this._url = url;
    this.initialized = false;
  }

  connect(timeoutMs = 15000): Promise<void> {
    console.log("connecting to websocket");
    return new Promise((resolve, reject) => {
      this._socket = new WebSocket(this._url);

      const timeout = setTimeout(() => {
        this._socket.close();
        reject(new Error("WebSocket timeout"));
      }, timeoutMs);

      this._socket.onopen = () => {
        console.log("connected!!");
        clearTimeout(timeout);
        resolve();
      };

      this._socket.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("WebSocket failed"));
      };

      this._socket.onmessage = (ev) => {
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
    if (!this._socket) return;
    this._socket.onmessage = null;
    this._socket.close();
  }
}
