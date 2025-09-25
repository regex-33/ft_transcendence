type MessageHandler = (data: any) => void;

type CloseHandler = (e: CloseEvent) => any;

export class Connection {
  private _socket!: WebSocket;
  private _handlers = new Map<string, MessageHandler[]>();
  private _url: string;
  private _onClose: CloseHandler | null;
  public initialized: boolean;
  static connecting: boolean = false;

  constructor(url: string, onClose: CloseHandler | null = null) {
    this._url = url;
    this._onClose = onClose;
    this.initialized = false;
  }

  onClose (callback: CloseHandler) {
    this._onClose = callback;
    if (!this._socket.OPEN)
      return;
    this._socket.onclose = callback;
  }

  connect(timeoutMs = 15000): Promise<void> {
    if (Connection.connecting)
    {
      console.log("already connecting");
      return Promise.reject();
    }
    Connection.connecting = true;
    console.log("connecting to websocket");
    return new Promise((resolve, reject) => {
      this._socket = new WebSocket(this._url);

      const timeout = setTimeout(() => {
        this._socket.close();
        reject(new Error("WebSocket timeout"));
      }, timeoutMs);

      this._socket.onopen = () => {
        console.log("connected!!");
        if (this._onClose)
          this._socket.onclose = this._onClose;
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
    this._socket.onerror = null;
    this._socket.onopen = null;
    this._socket.close();
  }
}
