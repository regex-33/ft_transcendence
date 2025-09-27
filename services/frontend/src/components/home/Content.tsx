import { GameModes } from "./GameModes";
import { h } from "../../vdom/createElement";
import { ComponentFunction } from "../../types/global";
import { useState } from "../../hooks/useState";
import { useEffect } from "../../hooks/useEffect";

interface PlayerData {
  userId: number;
  updatedAt: string;
  avatar: string;
  username: string;
  points: number;
  activeGameId: number | null;
}

export const Content: ComponentFunction = () => {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        const response = await fetch('/api/player/');
        if (!response.ok) {
          throw new Error('Failed to fetch player data');
        }
        const data = await response.json();
        setPlayerData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, []);

  if (loading) {
    return (
      <section className="w-full lg:w-[80%] flex flex-col items-center justify-center relative px-3 sm:px-6 md:px-8 mx-auto">
        <div className="w-full text-white text-center">
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-8xl font-inconsolata font-bold leading-tight">
            Loading...
          </h1>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full lg:w-[80%] flex flex-col items-center justify-center relative px-3 sm:px-6 md:px-8 mx-auto">
        <div className="w-full text-white text-center">
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-8xl font-inconsolata font-bold leading-tight">
            Error: {error}
          </h1>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full lg:w-[80%] flex flex-col items-center justify-center relative px-3 sm:px-6 md:px-8 mx-auto">
      <div className="w-full text-white text-center space-y-4 sm:space-y-6 md:space-y-7 transform -translate-y-8 sm:-translate-y-12 md:-translate-y-15 lg:-translate-y-9 lg:translate-x-8 xl:translate-x-14">
        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-8xl font-inconsolata font-bold leading-tight">
          Welcome Back, {playerData?.username || 'Player'}!
        </h1>

        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-inria font-medium">
          Ready to gaming?
        </h2>

        <div className="pt-2 sm:pt-4">
          <button
            onClick={(e: Event) => {
              e.preventDefault();
              window.history.pushState({}, "", "/game");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="px-8 sm:px-10 md:px-16 py-2 sm:py-3 md:py-4 
                 bg-no-repeat bg-contain bg-center
                 text-white font-bold 
                 transition-transform duration-200 hover:scale-95
                 focus:outline-none"
            style={{
              backgroundImage: "url('/images/home-assests/bg-button.svg')",
            }}
          >
            <span className="font-irish text-white text-lg sm:text-xl md:text-2xl lg:text-4xl tracking-wide">
              Start
            </span>
          </button>
        </div>
      </div>

      <GameModes playerPoints={playerData?.points || 0} />
    </section>
  );
};

