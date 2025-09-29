import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { useState } from '../../hooks/useState';
import { useEffect } from '../../hooks/useEffect';

type GamePlayer = {
  player: {
    avatar: string;
    username: string;
  };
  team: 'TEAM_A' | 'TEAM_B';
  score: number;
};

type ApiMatch = {
  duration: number;
  status: 'ENDED' | 'LIVE';
  mode: 'CLASSIC' | 'SPEED' | 'VANISH' | 'GOLD';
  type: 'SOLO';
  winningTeam: 'TEAM_A' | 'TEAM_B';
  gamePlayers: GamePlayer[];
};

type ProcessedMatch = {
  duration: string;
  score: string;
  mode: 'CLASSIC' | 'SPEED' | 'VANISH' | 'GOLD';
  status: 'LIVE' | 'ENDED';
  teamA: {
    avatars: string[];
    score: number;
  };
  teamB: {
    avatars: string[];
    score: number;
  };
};

export const Sidebar: ComponentFunction = () => {
  const [matches, setMatches] = useState<ProcessedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processMatches = (apiMatches: ApiMatch[]): ProcessedMatch[] => {
    return apiMatches.map(match => {
      const teamAPlayers = match.gamePlayers.filter(p => p.team === 'TEAM_A');
      const teamBPlayers = match.gamePlayers.filter(p => p.team === 'TEAM_B');
      
   
      const teamAScore = teamAPlayers.length > 0 ? teamAPlayers[0].score : 0;
      const teamBScore = teamBPlayers.length > 0 ? teamBPlayers[0].score : 0;

      // convert milliseconds to minutes:seconds
      const formatDuration = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      };

      return {
        duration: formatDuration(match.duration),
        score: `${teamAScore}:${teamBScore}`,
        mode: match.mode,
        status: match.status,
        teamA: {
          avatars: teamAPlayers.map(p => p.player.avatar),
          score: teamAScore
        },
        teamB: {
          avatars: teamBPlayers.map(p => p.player.avatar),
          score: teamBScore
        }
      };
    });
  };

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/game/recent`);
        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }
        const apiMatches: ApiMatch[] = await response.json();
        const processedMatches = processMatches(apiMatches);
        setMatches(processedMatches);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching matches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const MAX_MATCHES = 5;
  const filledMatches: (ProcessedMatch | null)[] = [...matches.slice(0, MAX_MATCHES)];

  while (filledMatches.length < MAX_MATCHES) {
    filledMatches.push(null);
  }

  const getTypeColor = (mode: ProcessedMatch['mode']) => {
    switch (mode) {
      case 'CLASSIC':
        return 'text-red-500';
      case 'SPEED':
        return 'text-yellow-400';
      case 'VANISH':
        return 'text-blue-900';
      case 'GOLD':
        return 'text-orange-400';
      default:
        return 'text-white';
    }
  };

  const getBackgroundColor = (status: ProcessedMatch['status']) => {
    switch (status) {
      case 'LIVE':
        return 'bg-[#6AE4E8]';
      case 'ENDED':
        return 'bg-[#6AE4E8] bg-opacity-55';
      default:
        return 'bg-[#3A3A3A]';
    }
  };

  if (loading) {
    return (
      <aside className="w-full max-w-[320px] sm:max-w-[280px] md:max-w-[290px] p-4 flex flex-col gap-5">
        <button
          className="w-full h-[105px] mb-12 bg-no-repeat bg-contain bg-center text-white flex items-center justify-center"
          style={{ backgroundImage: "url('/images/home-assests/recent.svg')" }}
        >
          <span className="font-irish tracking-wide text-base sm:text-lg md:text-xl pt-3">Recent matches</span>
        </button>
        <div className="flex items-center justify-center h-32">
          <span className="text-white font-rowdies">Loading matches...</span>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="w-full max-w-[320px] sm:max-w-[280px] md:max-w-[290px] p-4 flex flex-col gap-5">
        <button
          className="w-full h-[105px] mb-12 bg-no-repeat bg-contain bg-center text-white flex items-center justify-center"
          style={{ backgroundImage: "url('/images/home-assests/recent.svg')" }}
        >
          <span className="font-irish tracking-wide text-base sm:text-lg md:text-xl pt-3">Recent matches</span>
        </button>
        <div className="flex items-center justify-center h-32">
          <span className="text-red-400 font-rowdies">Error: {error}</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full max-w-[320px] sm:max-w-[280px] md:max-w-[290px] p-4 flex flex-col gap-5">
      <button
        className="w-full h-[105px] mb-12 bg-no-repeat bg-contain bg-center text-white flex items-center justify-center"
        style={{ backgroundImage: "url('/images/home-assests/recent.svg')" }}
      >
        <span className="font-irish tracking-wide text-base sm:text-lg md:text-xl pt-3">Recent matches</span>
      </button>

      <div className="flex flex-col gap-5 -translate-y-9 relative">
        {filledMatches.map((match, index) =>
          match ? (
            <div
              key={index}
              className={`rounded-[20px] px-4 py-3 shadow-lg w-full max-w-[270px] h-[135px] flex flex-col text-white ${getBackgroundColor(match.status)}`}
            >
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="relative -top-3 text-sm">{match.duration}</span>
                {match.status === "LIVE" && (
                  <div className="py-0.5 ml-0">
                    <img src="/images/home-assests/live.svg" alt="Live" className="w-10 h-10" />
                  </div>
                )}
                {match.status === "ENDED" && (
                  <div className="py-0.5 ml-1">
                    <img src="/images/home-assests/locked.svg" alt="Ended" className="w-10 h-10" />
                  </div>
                )}
                <span className={`${getTypeColor(match.mode)} font-luckiest text-sm relative -top-3 left-2`}>
                  {match.mode}
                </span>
              </div>

              <div className="flex justify-between items-center px-2 py-1 relative -top-5 space-x-2">
                <div className="flex flex-col space-y-0">
                  {match.teamA.avatars.map((avatar, idx) => (
                    <div className="relative w-11 h-11" key={idx}>
                      <img src="/images/home-assests/cir-offline.svg" className="absolute inset-0 w-full h-full z-0" />
                      <img
                        src={avatar}
                        className="absolute inset-[4px] w-[35px] h-[35px] rounded-full object-cover z-10"
                        alt={`Team A Player ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>

                <span className="text-3xl font-luckiest relative right-1 top-1">{match.score}</span>

                <div className="flex flex-col space-y-0">
                  {match.teamB.avatars.map((avatar, idx) => (
                    <div className="relative w-11 h-11" key={idx}>
                      <img src="/images/home-assests/cir-offline.svg" className="absolute inset-0 w-full h-full z-0" />
                      <img
                        src={avatar}
                        className="absolute inset-[4px] w-[35px] h-[35px] rounded-full object-cover z-10"
                        alt={`Team B Player ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div
              key={index}
              className="rounded-[20px] h-[84px] flex items-center justify-center text-[#C7C6C6] bg-[#6AE4E8] opacity-55 w-full max-w-[270px]"
            >
              <span className="font-rowdies text-2xl font-bold">
                No Match Found!
              </span>
            </div>
          )
        )}
      </div>
    </aside>
  );
};