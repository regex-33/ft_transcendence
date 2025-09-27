import { useEffect } from "../../hooks/useEffect";
import { useRef } from "../../hooks/useRef";
import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { Classic } from "./gameMode/Classic";
import { Speed } from "./gameMode/Speed";
import { Gold } from "./gameMode/Gold";
import { Vanish } from "./gameMode/Vanish";

interface Player {
  avatar: string;
  username: string;
}

interface GamePlayer {
  player: Player;
  team: "TEAM_A" | "TEAM_B";
  score: number;
}

interface GameHistory {
  duration: number;
  status: string;
  mode: "CLASSIC" | "SPEED" | "GOLD" | "VANISH";
  type: string;
  winningTeam: "TEAM_A" | "TEAM_B";
  gamePlayers: GamePlayer[];
}

export const MatchHistory: ComponentFunction = () => {
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  
  const formatDuration = (duration: number): string => {
    const totalSeconds = Math.floor(duration / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchGameHistory = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch('/api/player/game-history', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data: GameHistory[] = await response.json();
          setGameHistory(data || []);
        } else {
          throw new Error('Failed to fetch match history');
        }
      } catch (error) {
       setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchGameHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Loading game history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border w-[40%] border-red-500 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}
      </div>
    );
  }

  if (gameHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-white">
          <p className="text-lg mb-2">No game history yet</p>
          <p className="text-sm text-gray-500">Play some games to see your match history here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 h-[650px] px-5 overflow-x-auto mt-14">
      {gameHistory.slice(0, 6).map((game, index) => {
        // Find winner and loser based on winningTeam
        const teamAPlayer = game.gamePlayers.find(p => p.team === "TEAM_A");
        const teamBPlayer = game.gamePlayers.find(p => p.team === "TEAM_B");
        
        const winner = game.winningTeam === "TEAM_A" ? teamAPlayer : teamBPlayer;
        const loser = game.winningTeam === "TEAM_A" ? teamBPlayer : teamAPlayer;
        
        if (!winner || !loser) return null;
        
        return (
          <button
            key={`${index}-${game.duration}`}
            className="relative flex opacity-95 flex-col justify-center items-center space-y-5 h-[330px] w-[350px] text-white bg-no-repeat bg-contain bg-center flex-shrink-0 hover:opacity-100 transition-opacity duration-200"
            style={{ backgroundImage: `url('/images/setting-assests/Vector.svg')` }}>
            
            {/* Background overlay */}
            <div 
              className="absolute inset-0 bg-no-repeat bg-contain bg-center"
              style={{ backgroundImage: `url('/images/setting-assests/Vector.svg')` }}>
            </div>
            
            {/* Duration display */}
            <div className="absolute top-2 right-4 flex flex-col items-center z-20">
              <img
                src="/images/setting-assests/time.svg"
                alt="time"
                className="w-8 h-8 transition-transform duration-200 hover:scale-95"
              />
              <span className="font-luckiest text-sm pt-1 whitespace-nowrap">
                {formatDuration(game.duration)}
              </span>
            </div>
            
            {/* Game mode icon */}
            <div className="absolute top-3 left-7 w-14 h-14 flex flex-col items-center z-20">
              {(() => {
                const GameModeComponent = game.mode === 'SPEED' ? Speed :
                  game.mode === 'GOLD' ? Gold :
                  game.mode === 'CLASSIC' ? Classic :
                  game.mode === 'VANISH' ? Vanish : null;
                return GameModeComponent ? <GameModeComponent /> : null;
              })()}
            </div>
            
            {/* Winner */}
            <div className="bg-[#6EC2B4] w-[250px] rounded-full h-[60px] flex items-center gap-2 z-10">
              <div className="relative w-[60px] h-[60px] flex-shrink-0">
                <img
                  src="/images/home-assests/cir-online.svg"
                  className="absolute inset-0 w-full h-full z-0"
                  alt="Online circle"
                />
                <img
                  src={winner.player.avatar}
                  className="absolute inset-[8px] w-11 h-11 rounded-full object-cover z-10"
                  alt="Winner Avatar"
                />
              </div>
              <h2 className="text-lg font-bold truncate max-w-[120px] text-white">
                {winner.player.username.toUpperCase()}
              </h2>
              <span className="text-lg font-bold ml-auto pr-4 text-white">{winner.score}</span>
            </div>
            
            {/* Loser */}
            <div className="bg-[#828282] w-[250px] rounded-full h-[60px] flex items-center gap-2 bg-opacity-65 z-10">
              <div className="relative w-[60px] h-[60px] flex-shrink-0">
                <img
                  src="/images/home-assests/cir-online.svg"
                  className="absolute inset-0 w-full h-full z-0"
                  alt="Online circle"
                />
                <img
                  src={loser.player.avatar}
                  className="absolute inset-[8px] w-11 h-11 rounded-full object-cover z-10"
                  alt="Loser Avatar"
                />
              </div>
              <h2 className="text-lg font-bold truncate max-w-[120px] text-white">
                {loser.player.username.toUpperCase()}
              </h2>
              <span className="text-lg font-bold ml-auto pr-4 text-white">{loser.score}</span>
            </div>
            {/* {game.status !== 'ENDED' && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20">
                <span className="text-xs bg-yellow-600 px-2 py-1 rounded text-white">
                  {game.status}
                </span>
              </div>
            )} */}
          </button>
        );
      })}
    </div>
  );
};