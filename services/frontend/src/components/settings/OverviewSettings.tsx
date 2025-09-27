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

interface HighlightedGame {
  duration: number;
  status: string;
  mode: "CLASSIC" | "SPEED" | "GOLD" | "VANISH";
  type: string;
  winningTeam: "TEAM_A" | "TEAM_B";
  gamePlayers: GamePlayer[];
}

interface ApiResponse {
  rank: number;
  matchesWon: number;
  matchesLost: number;
  points: number;
  highlightedGames: HighlightedGame[];
}

interface OverviewSettingsProps {
  username?: string;
}

export const OverviewSettings: ComponentFunction<OverviewSettingsProps> = (props) => {
  const { username } = props || {};
  const [statsData, setStatsData] = useState({
    matchesWon: 0,
    leaderboardPosition: 0,
    matchesLost: 0,
    totalPoints: 0
  });
  const [highlightedGames, setHighlightedGames] = useState<HighlightedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper function to format duration from milliseconds to MM:SS
  const formatDuration = (duration: number): string => {
    const totalSeconds = Math.floor(duration / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchStatsData = async () => {
      setLoading(true);
      setError('');
      
      try {
        let endpoint;
        if (username) {
          // Viewing another user's profile
          endpoint = `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/player/overview/${username}`;
        } else {
          // Viewing own profile
          endpoint = `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/player/overview`;
        }

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data: ApiResponse = await response.json();
          setStatsData({
            matchesWon: data.matchesWon || 0,
            leaderboardPosition: data.rank || 0,
            matchesLost: data.matchesLost || 0,
            totalPoints: data.points || 0
          });
          setHighlightedGames(data.highlightedGames || []);
        } else {
          console.warn('Stats API failed, using default values');
          setError('Failed to load data from server');
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStatsData();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-row h-[300px] px-5 gap-20 pb-4">
        <div
          className="flex flex-col justify-center items-center w-[180px] text-white bg-no-repeat bg-contain bg-center"
          style={{ backgroundImage: `url('/images/setting-assests/bg-greenOve.svg')` }}>
          <img
            src="/images/setting-assests/gagne.svg"
            alt="Matches Won"
            className="w-8 h-8 transition-transform duration-200 hover:scale-95"
          />
          <span className="font-luckiest text-3xl pt-2 whitespace-nowrap">{statsData.matchesWon}</span>
          <span className="text-sm whitespace-nowrap">Matches Won</span>
        </div>
        <div
          className="flex flex-col justify-center items-center w-[180px] text-white bg-no-repeat bg-contain bg-center"
          style={{ backgroundImage: `url('/images/setting-assests/bg-greenOve.svg')` }}>
          <img
            src="/images/setting-assests/star.svg"
            alt="Leaderboard Position"
            className="w-10 h-10 transition-transform duration-200 hover:scale-95"
          />
          <span className="font-luckiest text-3xl pt-2 whitespace-nowrap">{statsData.leaderboardPosition}</span>
          <span className="text-sm whitespace-nowrap">Leader board Position</span>
        </div>
        <div
          className="flex flex-col justify-center items-center w-[180px] text-white bg-no-repeat bg-contain bg-center"
          style={{ backgroundImage: `url('/images/setting-assests/bg-greenOve.svg')` }}>
          <img
            src="/images/setting-assests/unlucky.svg"
            alt="Matches Lost"
            className="w-10 h-10 transition-transform duration-200 hover:scale-95"
          />
          <span className="font-luckiest text-3xl pt-2 whitespace-nowrap">{statsData.matchesLost}</span>
          <span className="text-sm whitespace-nowrap">Matches Losses</span>
        </div>
        <div
          className="flex flex-col justify-center items-center w-[180px] text-white bg-no-repeat bg-contain bg-center"
          style={{ backgroundImage: `url('/images/setting-assests/bg-greenOve.svg')` }}>
          <img
            src="/images/setting-assests/sales.svg"
            alt="Total Points"
            className="w-12 h-12 transition-transform duration-200 hover:scale-95"
          />
          <span className="font-luckiest text-3xl pt-2 whitespace-nowrap">{statsData.totalPoints}</span>
          <span className="text-sm whitespace-nowrap">Total Pts</span>
        </div>
      </div>
      
      <div className="-mt-10 pl-9 -space-y-4">
        <h1 className="font-luckiest text-lg pt-2 whitespace-nowrap text-white">HIGHLIGHTED MATCHES</h1>
        <h3 className="pt-2 text-sm text-gray-200">Best matches played</h3>
      </div>
      
      <div className="flex flex-row h-[450px] px-5 gap-12 overflow-x-auto mt-16 ml-0">
        {highlightedGames.length === 0 ? (
          <div className="flex items-center justify-center w-full h-[330px] text-white">
            <div className="text-center">
              <p className="text-lg">No highlighted matches yet</p>
              <p className="text-sm text-gray-500">Play some games to see your best matches here!</p>
            </div>
          </div>
        ) : (
          highlightedGames.slice(0, 3).map((game, index) => {
            // Find winner and loser based on winningTeami
            const teamAPlayer = game.gamePlayers.find(p => p.team === "TEAM_A");
            const teamBPlayer = game.gamePlayers.find(p => p.team === "TEAM_B");
            
            const winner = game.winningTeam === "TEAM_A" ? teamAPlayer : teamBPlayer;
            const loser = game.winningTeam === "TEAM_A" ? teamBPlayer : teamAPlayer;
            
            if (!winner || !loser) return null;
            
            return (
              <div
                key={index}
                className="relative flex opacity-95 flex-col justify-center items-center space-y-5 h-[330px] w-[380px] text-white bg-no-repeat bg-contain bg-center flex-shrink-0"
                style={{ backgroundImage: `url('/images/setting-assests/Vector.svg')` }}>
                <div className="absolute top-4 right-4 flex flex-col items-center">
                  <img
                    src="/images/setting-assests/time.svg"
                    alt="time"
                    className="w-8 h-8 transition-transform duration-200 hover:scale-95"
                  />
                  <span className="font-luckiest text-sm pt-1 whitespace-nowrap">
                    {formatDuration(game.duration)}
                  </span>
                </div>
                
                {/* Winner */}
                <div className="bg-[#6EC2B4] w-[250px] rounded-full h-[60px] flex items-center gap-2">
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
                <div className="bg-[#828282] w-[250px] rounded-full h-[60px] flex items-center gap-2 bg-opacity-65">
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
                
                {/* Game Mode Icon */}
                <div className="w-14 h-14 absolute top-1 left-10 flex flex-col items-center">
                  {(() => {
                    const GameModeComponent = game.mode === 'SPEED' ? Speed :
                      game.mode === 'GOLD' ? Gold :
                      game.mode === 'CLASSIC' ? Classic :
                      game.mode === 'VANISH' ? Vanish : null;
                    return GameModeComponent ? <GameModeComponent /> : null;
                  })()}
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
          <p className="text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
};