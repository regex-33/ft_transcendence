import { Connection } from "./connection";
import { Player } from "./GamePage";
import { UpdateMessage } from "./types";

export class GameConfig {
  static canvasWidth = 0;
  static canvasHeight = 0;
  static paddleWidth = 0;
  static paddlePercent = 3;
  static ballRadius = 2 * (GameConfig.canvasWidth / 200);
  static readonly paddleRatio = 15 / 3;
  static readonly canvasRatio = 1 / 2;
  static upKeys = new Set(["arrowLeft", "arrowUp", "W", "w", "a", "A"]);
  static downKeys = new Set(["arrowRight", "arrowDown", "d", "D", "s", "S"]);

  static onResize(width: number, height: number) {
    GameConfig.canvasWidth = width;
    GameConfig.canvasHeight = height;
    GameConfig.paddleWidth = (width * GameConfig.paddlePercent) / 100;
    GameConfig.ballRadius = 2 * (GameConfig.canvasWidth / 200);
  }
}

export const leftPaddleOptions: paddleOptions = {
  color: "#F9A346",
  dir: "left",
};

export const rightPaddleOptions: paddleOptions = {
  color: "#497E87",
  dir: "right",
};

export type paddleOptions = {
  color: string;
  dir: "left" | "right";
};

export class Paddle {
  x: number;
  y: number;
  options: paddleOptions;
  constructor(x: number, y: number, opt: paddleOptions) {
    this.x = x;
    this.y = y;
    this.options = opt;
  }
  draw = (ctx: CanvasRenderingContext2D) => {
    const paddle = this;
    const width = GameConfig.paddleWidth;
    const height = width * GameConfig.paddleRatio;
    const radius = (width * 1) / 2;

    const { x, y, options } = paddle;
    ctx.beginPath();

    if (options.dir === "right") {
      ctx.moveTo(x, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      );
      ctx.lineTo(x, y + height);
    } else {
      ctx.moveTo(x + width, y);
      ctx.lineTo(x + radius, y);
      ctx.quadraticCurveTo(x, y, x, y + radius);
      ctx.lineTo(x, y + height - radius);
      ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
      ctx.lineTo(x + width, y + height);
    }
    ctx.closePath();
    ctx.fillStyle = options.color;
    ctx.fill();
  };
}

export type Ball = {
  x: number;
  y: number;
  color: string;
};

export enum GameType {
  SOLO = "SOLO",
  TEAM = "TEAM",
}

export enum GameMode {
  CLASSIC = "CLASSIC",
  SPEED = "SPEED",
}

const ballWidth = 10;

const drawBall = (ctx: CanvasRenderingContext2D, ball: Ball) => {
  ctx.beginPath();
  const radius = GameConfig.ballRadius;
  ctx.arc(ball.x, ball.y, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = ball.color;
  ctx.fill();
  ctx.stroke();
};

export type PlayerState = {
  id: number;
  score: number;
  paddle: {
    x: number;
    y: number;
    dir: "LEFT" | "RIGHT";
  };
};

export class Game {
  paddles: Paddle[];
  ball: Ball = {
    x: -999,
    y: -999,
    color: "red",
  };
  type: GameType;
  mode: GameMode;
  id: string;
  ctx: CanvasRenderingContext2D;
  _connection: Connection;
  _setScores: Function;
  _setPlayers: Function;
  _scores: number[];
  private _activeKeys: Set<string>;

  constructor(
    ctx: CanvasRenderingContext2D,
    { id, type, mode }: { id: string; type: GameType; mode: GameMode },
    setScores: Function,
    setPlayers: Function
  ) {
    this._activeKeys = new Set();
    this._setScores = setScores;
    this._setPlayers = setPlayers;
    this.ctx = ctx;
    this.id = id;
    this._scores = [0, 0];
    const p1 = new Paddle(10, GameConfig.canvasHeight / 2, leftPaddleOptions);
    const p2 = new Paddle(
      GameConfig.canvasWidth - GameConfig.paddleWidth - 10,
      GameConfig.canvasHeight / 2,
      rightPaddleOptions
    );
    this.paddles = [p1, p2];
    this._connection = new Connection(
      `${import.meta.env.VITE_WS_GAME_SERVICE_HOST}/play/efpep`
    );
    this.type = type;
    this.mode = mode;
  }

  async _initConnection() {
    await this._connection.connect();
    const gameId = this.id;
    const playerId = 10; // TODO use id;
    this._connection.send({
      type: "action",
      action_type: "INIT",
      gameId,
      playerId,
    });
    const updateMsg: UpdateMessage = await this._connection.once("update");
    if (!updateMsg.message.includes("initialized"))
      throw new Error("unexpected message");
    this._connection.initialized = true;
  }

  onServerUpdate = (data: {
    ball: { x: number; y: number };
    players: PlayerState[];
  }) => {
    console.log("serverUpdate");
    this.ball.x = data.ball.x * (GameConfig.canvasWidth / 200);
    const serverHeight = 200 * GameConfig.canvasRatio;
    this.ball.y = data.ball.y * (GameConfig.canvasHeight / serverHeight);
    const paddles = data.players.map((p) => p.paddle);

    const leftScore =
      data.players.find((p) => p.paddle.dir === "LEFT")?.score ||
      this._scores[0];
    const rightScore =
      data.players.find((p) => p.paddle.dir === "RIGHT")?.score ||
      this._scores[1];
    if (leftScore !== this._scores[0] || rightScore !== this._scores[1]) {
      this._setScores([leftScore, rightScore]);
      this._scores = [leftScore, rightScore];
    }
    this.paddles[0].x = paddles[0].x * (GameConfig.canvasWidth / 200);
    this.paddles[0].y = paddles[0].y * (GameConfig.canvasHeight / serverHeight);

    this.paddles[1].x = paddles[1].x * (GameConfig.canvasWidth / 200);
    this.paddles[1].y = paddles[1].y * (GameConfig.canvasHeight / serverHeight);
  };

  draw = () => {
    this.ctx.clearRect(0, 0, GameConfig.canvasWidth, GameConfig.canvasHeight);
    this.paddles.forEach((paddle) => {
      paddle.draw(this.ctx);
    });
    drawBall(this.ctx, this.ball);
  };

  start = (connection: Connection) => {
    console.log(this.paddles);
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    requestAnimationFrame(this._renderFrame);

    connection.on("PLAYERS_UPDATE", (data) => {
      //console.log("fetch data:", data);
    });
    connection.on("GAME_UPDATE", this.onServerUpdate);
    connection.on("PLAYER_DISCONNECT", this._onPlayerDisconnect);
    connection.on("PLAYER_CONNECT", this._onPlayerConnect);
    this._connection = connection;
  };

  private _onPlayerDisconnect = (data: {
    type: string;
    players: PlayerState[];
    playerId: number;
    timeout: number;
  }) => {
    console.log("DISCONNECT RECEIVED: ", data);
    // data.players.filter(p => )
  };

  private _onPlayerConnect = (data: {
    type: string;
    players: Player[];
    playerId: number;
  }) => {
    const players = data.players.map(
      ({ userId, username, avatar, ...rest }) => ({ userId, username, avatar })
    );
    console.log("players:", players);
    this._setPlayers(players);
    console.log("connect received:", data);
  };

  private _onKeyDown = (e: KeyboardEvent) => {
    let keys;
    if (GameConfig.downKeys.has(e.key)) keys = GameConfig.downKeys;
    else if (GameConfig.upKeys.has(e.key)) keys = GameConfig.upKeys;
    else return;
    for (const key in this._activeKeys) {
      if (keys.has(key)) return;
    }
    this._activeKeys.add(e.key);
  };

  private _onKeyUp = (e: KeyboardEvent) => {
    this._activeKeys.delete(e.key);
  };

  private _sendEvent = (key: string) => {
    console.log("send eent:", key);
    const p1 = this.paddles[0];
    if (GameConfig.upKeys.has(key)) {
      this._connection.send({ type: "UPDATE", action: "KEY_UP" });
    } else if (GameConfig.downKeys.has(key)) {
      this._connection.send({ type: "UPDATE", action: "KEY_DOWN" });
    }
    console.log("key:", key);
  };

  private _renderFrame = () => {
    for (const key of this._activeKeys) this._sendEvent(key);
    this.draw();
    requestAnimationFrame(this._renderFrame);
  };
}
