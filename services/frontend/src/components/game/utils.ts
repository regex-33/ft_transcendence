import { GameMode, GameType } from "./game";

export const redirectToActiveGame = async () => {
  const response = await fetch(
    `${import.meta.env.VITE_GAME_SERVICE_HOST}:${import.meta.env.VITE_GAME_SERVICE_PORT}/api/player/games`,
    {
      method: "GET",
      credentials: "include",
    },
  );
  if (!response.ok) return;
  const games = await response.json();
  if (!(games instanceof Array)) return;
  for (let i = 0; i < games.length; i++) {
    if (["WAITING", "LIVE"].includes(games[i].status)) {
      window.history.pushState({}, "", "/game/" + games[i].id);
      window.dispatchEvent(new PopStateEvent("popstate"));
      return;
    }
  }
};

export const createNewGame = async (
  type: GameType,
  mode: GameMode = GameMode.CLASSIC,
  redirectOnError = true,
) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_GAME_SERVICE_HOST}:${import.meta.env.VITE_GAME_SERVICE_PORT}/api/game/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameType: type,
          gameMode: mode,
        }),
        credentials: "include",
      },
    );
    const data = await response.json();
    if (!response.ok) {
      //const data = await response.json();
      if (response.status === 401) {
        if (redirectOnError) redirectToActiveGame();
      }
      return { status: "error", ...data };
    }
    return { status: "ok", game: data };
  } catch (error) {
    return { status: "error", error };
  }
};
