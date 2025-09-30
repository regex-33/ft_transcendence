import { Connection } from "./connection";
import { Player } from "./GamePage";
import { UpdateMessage } from "./types";
import koraSVG from "../../../images/game-assets/kora.svg";
import koraGoldSVG from "../../../images/game-assets/kora-gold.svg";
import { throttle } from "../../utils/throttle";

const MAX_SCORE = 4;
export class GameConfig {
  static canvasWidth = 0;
  static canvasHeight = 0;
  static paddleWidth = 0;
  static paddlePercent = 2;
  static paddleSpeed = 0.6;
  static ballSpeed = 0.4;
  static SpeedBallSpeed = 0.8;
  static ballRadius = 3 * (GameConfig.canvasWidth / 200);
  static readonly paddleRatio = 20 / 3;
  static readonly canvasRatio = 1 / 2;
  static upKeys = new Set(["ArrowLeft", "ArrowUp", "W", "w", "a", "A"]);
  static downKeys = new Set(["ArrowRight", "ArrowDown", "d", "D", "s", "S"]);
  static player1UpKeys = new Set(["ArrowLeft", "ArrowUp"]);
  static player1DownKeys = new Set(["ArrowRight", "ArrowDown"]);
  static player2UpKeys = new Set(["W", "w", "a", "A"]);
  static player2DownKeys = new Set(["d", "D", "s", "S"]);

  static onResize(width: number, height: number) {
    GameConfig.canvasWidth = width;
    GameConfig.canvasHeight = height;
    GameConfig.paddleWidth = (width * GameConfig.paddlePercent) / 100;
    GameConfig.ballRadius = 3 * (GameConfig.canvasWidth / 200);
  }
}

function isColliding(ball: Ball, paddle: Paddle) {
  const ballLeft = ball.x - GameConfig.ballRadius;
  const ballRight = ball.x + GameConfig.ballRadius;
  const ballTop = ball.y - GameConfig.ballRadius;
  const ballBottom = ball.y + GameConfig.ballRadius;
  const paddleLeft = paddle.x;
  const paddleRight = paddle.x + GameConfig.paddleWidth;
  const paddleTop = paddle.y;
  const paddleHeight = GameConfig.paddleWidth * GameConfig.paddleRatio;
  const paddleBottom = paddle.y + paddleHeight;
  return (
    ballRight > paddleLeft &&
    ballLeft < paddleRight &&
    ballBottom > paddleTop &&
    ballTop < paddleBottom
  );
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
    //	//console.log('draw:', GameConfig.paddleRatio, GameConfig.paddleWidth);
    //	//console.log('draw:', height);
    const radius = (width * 1) / 2;

    const { x: px, y, options } = paddle;
    let x = px;
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
        y + height,
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
  vx: number;
  vy: number;
  color: string;
};

export enum GameType {
  SOLO = "SOLO",
  TEAM = "TEAM",
}

export enum GameMode {
  CLASSIC = "CLASSIC",
  SPEED = "SPEED",
  VANISH = "VANISH",
  GOLD = "GOLD",
}

const koraImg = new Image(GameConfig.ballRadius * 2, GameConfig.ballRadius * 2);
koraImg.src = koraSVG;

const koraGoldImg = new Image(
  GameConfig.ballRadius * 2,
  GameConfig.ballRadius * 2,
);
koraGoldImg.src = koraGoldSVG;

const drawBall = (
  ctx: CanvasRenderingContext2D,
  ball: Ball,
  alpha = 1,
  gold = false,
) => {
  // ctx.beginPath();
  const radius = GameConfig.ballRadius * (gold ? 3 : 2);
  // ctx.arc(ball.x, ball.y, radius, 0, 2 * Math.PI);
  // ctx.strokeStyle = ball.color;
  // ctx.fill();
  // ctx.stroke();
  ctx.save();
  ctx.globalAlpha = alpha;
  const img = gold ? koraGoldImg : koraImg;
  ctx.drawImage(
    img,
    ball.x - GameConfig.ballRadius - (gold ? 7 : 0),
    ball.y - GameConfig.ballRadius,
    radius,
    radius,
  );
  ctx.restore();
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

abstract class Game {
  paddles: Paddle[];
  ball: Ball = {
    x: GameConfig.canvasWidth / 2 - GameConfig.ballRadius,
    y: GameConfig.canvasHeight / 2 - GameConfig.ballRadius,
    vx: 1,
    vy: 1,
    color: "red",
  };
  type: GameType;
  mode: GameMode;
  id: string;
  ctx: CanvasRenderingContext2D;
  protected _setScores: Function;
  protected _setPlayers: Function;
  protected _scores: number[];
  protected _status: "WAITING" | "LIVE" | "ENDED" = "WAITING";
  protected _activeKeys: Set<string>;
  protected _lastUpdate = performance.now();
  protected _endgameText = "";
  protected ballAlpha: number = 1;
  protected vanishState: "IN" | "OUT" | "NONE" = "NONE";
  protected nextVanishTime: number = 0;

  constructor(
    ctx: CanvasRenderingContext2D,
    { id, type, mode }: { id: string; type: GameType; mode: GameMode },
    setScores: Function,
    setPlayers: Function,
  ) {
    //console.log("construtor mode:", mode);
    this.mode = mode;
    this.type = type;
    this._activeKeys = new Set();
    this._setScores = setScores;
    this._setPlayers = setPlayers;
    this.ctx = ctx;
    this.id = id;
    this._scores = [0, 0];
    this._setScores([...this._scores]);
    const paddleHeight = GameConfig.paddleWidth * GameConfig.paddleRatio;
    const p1 = new Paddle(
      10,
      GameConfig.canvasHeight / 2 - paddleHeight / 2,
      leftPaddleOptions,
    );
    if (this.mode === GameMode.GOLD || this.type === GameType.TEAM)
      p1.options.color = "#C9EEF7";
    const p2 = new Paddle(
      GameConfig.canvasWidth - GameConfig.paddleWidth - 10,
      GameConfig.canvasHeight / 2 - paddleHeight / 2,
      rightPaddleOptions,
    );
    if (this.mode === GameMode.GOLD || this.type === GameType.TEAM)
      p2.options.color = "#62BFDD";
    if (this.type === GameType.TEAM) {
    const p4 = new Paddle(
      GameConfig.canvasWidth - GameConfig.paddleWidth - 10,
      GameConfig.canvasHeight / 2 - paddleHeight / 2,
      rightPaddleOptions,
    );
    const p3 = new Paddle(
      GameConfig.canvasWidth - GameConfig.paddleWidth - 10,
      GameConfig.canvasHeight / 2 - paddleHeight / 2,
      leftPaddleOptions,
    );
      p1.y /= 2;
      p2.y /= 2;
      this.paddles = [p1, p2, p3, p4];
      //console.log('paddles', this.paddles);
    } else this.paddles = [p1, p2];
  }

  protected resetVanish() {
    //console.log("reset vanish");
    this.vanishState = "NONE";
    this.ballAlpha = 1;
    this.nextVanishTime = performance.now() + 1000 + Math.random() * 1000;
  }

  protected _onKeyDown = (e: KeyboardEvent) => {
    let keys;
    if (GameConfig.downKeys.has(e.key)) keys = GameConfig.downKeys;
    else if (GameConfig.upKeys.has(e.key)) keys = GameConfig.upKeys;
    else return;
    for (const key in this._activeKeys) {
      if (keys.has(key)) return;
    }
    this._activeKeys.add(e.key);
  };

  protected _onKeyUp = (e: KeyboardEvent) => {
    this._activeKeys.delete(e.key);
  };

  draw = () => {
    //console.log("mode", this.mode);
    if (this.mode === GameMode.VANISH || this.mode === GameMode.GOLD) {
      const now = performance.now();

      if (this.vanishState === "NONE" && now >= this.nextVanishTime) {
        this.vanishState = "OUT";
        this.ballAlpha = 1;
      } else {
        //console.log("its vanish:", this.vanishState);
        //console.log("diff:", now, this.nextVanishTime);
      }
      const fadeSpeed = 0.05;
      if (this.vanishState === "OUT") {
        this.ballAlpha -= fadeSpeed;
        if (this.ballAlpha <= 0) {
          this.ballAlpha = 0;
          this.vanishState = "IN";
          this.nextVanishTime = now + 1000 + Math.random() * 1000;
        }
      } else if (this.vanishState === "IN" && now >= this.nextVanishTime) {
        this.ballAlpha += fadeSpeed;
        if (this.ballAlpha >= 1) {
          this.ballAlpha = 1;
          this.vanishState = "NONE";
          this.nextVanishTime = now + 2000 + Math.random() * 2000;
        }
      }
    }
    this.ctx.clearRect(0, 0, GameConfig.canvasWidth, GameConfig.canvasHeight);
    this.paddles.forEach((paddle) => {
      paddle.draw(this.ctx);
    });
    drawBall(this.ctx, this.ball, this.ballAlpha, this.mode === GameMode.GOLD);
  };
}

export class RemoteGame extends Game {
  private _connection: Connection | null;
  private _setSpectators: Function;

  constructor(
    ctx: CanvasRenderingContext2D,
    { id, type, mode }: { id: string; type: GameType; mode: GameMode },
    setScores: Function,
    setPlayers: Function,
    setSpectators: Function,
  ) {
    super(ctx, { id, type, mode }, setScores, setPlayers);
    this._setSpectators = setSpectators;
    this._connection = null;
  }

  onServerUpdate = (data: {
    ball: { x: number; y: number; vx: number; vy: number };
    players: PlayerState[];
  }) => {
    if (this._status !== "LIVE") this._status = "LIVE";
    this.ball.x = data.ball.x * (GameConfig.canvasWidth / 200);
    const serverHeight = 200 * GameConfig.canvasRatio;
    this.ball.y = data.ball.y * (GameConfig.canvasHeight / serverHeight);
    this.ball.vy = data.ball.vy;
    this.ball.vx = data.ball.vx;
    const paddles = data.players.map((p) => p.paddle);

    const leftScore =
      data.players.find((p) => p.paddle.dir === "LEFT")?.score ||
      this._scores[0];
    const rightScore =
      data.players.find((p) => p.paddle.dir === "RIGHT")?.score ||
      this._scores[1];
    if (leftScore !== this._scores[0] || rightScore !== this._scores[1]) {
      this.resetVanish();
      this._setScores([leftScore, rightScore]);
      this._scores = [leftScore, rightScore];
    }
    //console.log('received paddles', paddles);
    this.paddles.map((paddle, idx) => {
      paddle.x = paddles[idx].x * (GameConfig.canvasWidth / 200);
      paddle.y = paddles[idx].y * (GameConfig.canvasHeight / serverHeight);
    });
    this._lastUpdate = performance.now();
  };

  start(connection: Connection, isSpec = false) {
    //console.log(this.paddles);
    if (!isSpec) {
      window.addEventListener("keydown", this._onKeyDown);
      window.addEventListener("keyup", this._onKeyUp);
    }
    requestAnimationFrame(this._renderFrame);

    connection.on("PLAYERS_UPDATE", (data) => {
      ////console.log("fetch data:", data);
    });
    connection.on("GAME_UPDATE", this.onServerUpdate);
    connection.on("PLAYER_DISCONNECT", this._onPlayerDisconnect);
    connection.on("PLAYER_CONNECT", this._onPlayerConnect);
    connection.on(
      "GAME_END",
      (data: { players: Player[]; winners: { username: string }[] }) => {
        this._scores = data.players.map((player) => player.score);
        const maxScore = Math.max(...this._scores);
        const winners = data.winners.map((w) => w.username);
        //console.log("winners: ", winners);
        //console.log("maxScore: ", maxScore);
        //console.log("data.players: ", data.players);
        if (winners.length > 1)
          this._endgameText = "Winners: " + winners.join(" ");
        else this._endgameText = "Winner: " + winners.join(" ");
        this._setScores(this._scores);
        this._status = "ENDED";
      },
    );
    this._connection = connection;
  }

  private _onPlayerDisconnect = (data: {
    type: string;
    players: PlayerState[];
    playerId: number;
    timeout: number;
  }) => {
    //console.log("DISCONNECT RECEIVED: ", data);
    // data.players.filter(p => )
  };

  private _onPlayerConnect = (data: {
    type: string;
    players: Player[];
    spectators: Omit<Player, "score">[];
    playerId: number;
  }) => {
    const players = data.players.map(
      ({ userId, username, avatar, ...rest }) => ({ userId, username, avatar }),
    );
    //console.log("players:", players);
    //console.log("spectators:", data.spectators);
    this._setPlayers(players);
    this._setSpectators(data.spectators);
    //console.log("connect received:", data);
  };

  private _sendEvent = throttle((key: string) => {
    //console.log("send event:", key);
    if (GameConfig.upKeys.has(key)) {
      this._connection!.send({ type: "UPDATE", action: "KEY_UP" });
    } else if (GameConfig.downKeys.has(key)) {
      this._connection!.send({ type: "UPDATE", action: "KEY_DOWN" });
    }
    //console.log("key:", key);
  }, 20);

  private _renderFrame = () => {
    for (const key of this._activeKeys) this._sendEvent(key);
    if (this._status === "LIVE") {
      //console.log("dt:", performance.now() - this._lastUpdate);
      const speed = 0.1 * (200 / GameConfig.canvasWidth);
      const dt = performance.now() - this._lastUpdate - 16;
      if (dt > 0) this.ball.x += this.ball.vx * dt * speed;
      this.ball.y += this.ball.vy * dt * speed;
      this.draw();
    } else if (this._status === "ENDED") {
      this.ctx.clearRect(0, 0, GameConfig.canvasWidth, GameConfig.canvasHeight);
      this.ctx.font = "30px Luckiest Guy";
      this.ctx.fillStyle = "#F7F4EA";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      const centerX = GameConfig.canvasWidth / 2;
      const centerY = GameConfig.canvasHeight / 2;
      this.ctx.fillText(this._endgameText, centerX, centerY);
    }
    requestAnimationFrame(this._renderFrame);
  };
}

export class LocalGame extends Game {
  constructor(
    ctx: CanvasRenderingContext2D,
    { id, type, mode }: { id: string; type: GameType; mode: GameMode },
    setScores: Function,
    setPlayers: Function,
  ) {
    super(ctx, { id, type, mode }, setScores, setPlayers);
  }

  start() {
    //console.log(this.paddles);
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    this._lastUpdate = performance.now();
    requestAnimationFrame(this._renderFrame);
    this._status = "LIVE";
  }

  private _movePaddle(key: string, dt: number) {
    let paddleIdx = 0;
    let dir: "UP" | "DOWN" = "UP";
    if (
      GameConfig.player1DownKeys.has(key) ||
      GameConfig.player2DownKeys.has(key)
    ) {
      dir = "DOWN";
    }
    if (
      GameConfig.player2DownKeys.has(key) ||
      GameConfig.player2UpKeys.has(key)
    ) {
      paddleIdx = 1;
    }
    const paddleHeight = GameConfig.paddleRatio * GameConfig.paddleWidth;
    //console.log("move:", GameConfig.paddleRatio, GameConfig.paddleWidth);
    this.paddles[paddleIdx]!.y +=
      dir === "UP" ? -GameConfig.paddleSpeed * dt : GameConfig.paddleSpeed * dt;
    if (this.paddles[paddleIdx].y < 0) this.paddles[paddleIdx].y = 0;
    if (this.paddles[paddleIdx].y + paddleHeight > GameConfig.canvasHeight)
      this.paddles[paddleIdx].y = GameConfig.canvasHeight - paddleHeight;
    //console.log("move:", paddleHeight, GameConfig.canvasHeight);
    //console.log(
    //   this.paddles[paddleIdx].y,
    //   this.paddles[paddleIdx].y + paddleHeight,
    // );
  }

  protected _onKeyDown = (e: KeyboardEvent) => {
    let keys;

    let downKeys, upKeys;
    if (
      GameConfig.player1UpKeys.has(e.key) ||
      GameConfig.player1DownKeys.has(e.key)
    ) {
      upKeys = GameConfig.player1UpKeys;
      downKeys = GameConfig.player1DownKeys;
    } else if (
      GameConfig.player2UpKeys.has(e.key) ||
      GameConfig.player2DownKeys.has(e.key)
    ) {
      upKeys = GameConfig.player2UpKeys;
      downKeys = GameConfig.player2DownKeys;
    } else return;

    if (downKeys.has(e.key)) keys = downKeys;
    if (upKeys.has(e.key)) keys = upKeys;

    for (const key in this._activeKeys) {
      if (keys!.has(key)) return;
    }
    this._activeKeys.add(e.key);
  };

  private calcFrame(dt: number) {
    let ballSpeed =
      this.mode === "SPEED" ? GameConfig.SpeedBallSpeed : GameConfig.ballSpeed;
    ballSpeed *= dt;
    const paddleHeight = GameConfig.paddleRatio * GameConfig.paddleWidth;
    this.ball.x += this.ball.vx * ballSpeed;
    this.ball.y += this.ball.vy * ballSpeed;
    if (this.ball.x + GameConfig.ballRadius > GameConfig.canvasWidth) {
      //terminateGame = goal(players, 'RIGHT');
      if (++this._scores[0] === MAX_SCORE) {
        this._status = "ENDED";
        this._endgameText = "Player 1 Won";
      }
      this.resetVanish();
      this._setScores([...this._scores]);
      //console.log("score:", this._scores);
      this.ball.x = GameConfig.canvasWidth / 2;
      this.ball.y = GameConfig.canvasHeight / 2;
      this.ball.vx *= -1;
      this.ball.vy = 1;
    }

    if (this.ball.x - GameConfig.ballRadius < 0) {
      //terminateGame = goal(players, 'LEFT');
      if (++this._scores[1] === MAX_SCORE) {
        this._status = "ENDED";
        this._endgameText = "Player 2 Won";
      }
      this.resetVanish();
      //console.log("score:", this._scores);
      this._setScores([...this._scores]);
      this.ball.x = GameConfig.canvasWidth / 2;
      this.ball.y = GameConfig.canvasHeight / 2;
      this.ball.vx *= -1;
      this.ball.vy = -1;
    }

    if (this.ball.y + GameConfig.ballRadius > GameConfig.canvasHeight) {
      this.ball.y = GameConfig.canvasHeight - GameConfig.ballRadius;
      this.ball.vy *= -1;
    }

    if (this.ball.y - GameConfig.ballRadius < 0) {
      this.ball.y = GameConfig.ballRadius;
      this.ball.vy *= -1;
    }

    this.paddles.forEach((paddle) => {
      if (isColliding(this.ball, paddle)) {
        if (this.ball.vx > 0) this.ball.x = paddle.x - GameConfig.ballRadius;
        if (this.ball.vx < 0)
          this.ball.x =
            paddle.x + GameConfig.paddleWidth + GameConfig.ballRadius;
        this.ball.vx *= -1;
        this.ball.vy =
          (this.ball.y - (paddle.y + paddleHeight / 2)) / paddleHeight;
        //ball.vy *= -1;
      }
    });
    this.paddles.forEach((paddle) => {
      if (paddle.options.dir === "left") paddle.x = 15;
      else paddle.x = GameConfig.canvasWidth - GameConfig.paddleWidth - 15;
    });
  }

  private _renderFrame = () => {
    const now = performance.now();
    const dt = performance.now() - this._lastUpdate;
    if (this._status === "LIVE") {
      for (const key of this._activeKeys) {
        this._movePaddle(key, dt);
      }
      this.calcFrame(dt);
      this._lastUpdate = performance.now();
      this.draw();
    }
    // if (dt > 20)
      //console.log(
      //   "render/calculation time:",
      //   performance.now() - now,
      //   "dt (last - now):",
      //   dt,
      // );
    if (this._status === "ENDED") {
      this.ctx.clearRect(0, 0, GameConfig.canvasWidth, GameConfig.canvasHeight);
      this.ctx.font = "30px Luckiest Guy";
      this.ctx.fillStyle = "#F7F4EA";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      const centerX = GameConfig.canvasWidth / 2;
      const centerY = GameConfig.canvasHeight / 2;
      this.ctx.fillText(this._endgameText, centerX, centerY);
    }
    requestAnimationFrame(this._renderFrame);
  };
}
