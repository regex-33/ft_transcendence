import { useEffect } from "../../hooks/useEffect";
import { useRef } from "../../hooks/useRef";
import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { Classic } from "./gameMode/Classic";
import { Speed } from "./gameMode/Speed";
import { Gold } from "./gameMode/Gold";
import { Vanish } from "./gameMode/Vanish";

interface OverviewSettingsProps {
  username?: string;
}

export const ProfileOverview: ComponentFunction<OverviewSettingsProps> = (props) => {
    console.log("ProfileOverview propsssssssssssssssssssssssss:", props);
  const { username } = props || {};
  const [statsData, setStatsData] = useState({
    matchesWon: 0,
    leaderboardPosition: 0,
    matchesLost: 0,
    achievements: 0,
    totalPoints: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const highlightedMatches = [
    {
      id: 1,
      time: "12:30",
      type: 'SPEED',
      player1: {
        name: "YOUSSEF",
        avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
        score: 7
      },
      player2: {
        name: "AHMED",
        avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
        score: 4
      }
    },
    {
      id: 2,
      time: "14:45",
      type: 'GOLD',
      player1: {
        name: "ALI",
        avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
        score: 3
      },
      player2: {
        name: "OMAR",
        avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
        score: 5
      }
    },
    {
      id: 3,
      time: "16:20",
      type: 'CLASSIC',
      player1: {
        name: "najib",
        avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
        score: 6
      },
      player2: {
        name: "LINA",
        avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
        score: 8
      }
    }
  ];

  useEffect(() => {
    const fetchStatsData = async () => {
      setLoading(true);
      setError('');
      
      try {
        let endpoint;
        endpoint = `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users/${username}`;
       
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setStatsData({
            matchesWon: data.matchesWon || 320,
            leaderboardPosition: data.leaderboardPosition || 200,
            matchesLost: data.matchesLost || 12,
            achievements: data.achievements || 9,
            totalPoints: data.totalPoints || 450
          });
        } else {
            setStatsData({
                matchesWon: 320,
                leaderboardPosition: 200,
                matchesLost: 12,
                achievements: 9,
                totalPoints:  450
              });
          console.warn('Stats API failed, using default values');
        }
      setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError('Failed to load statistics');
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
            src="/images/setting-assests/unlocked.svg"
            alt="Achievements"
            className="w-10 h-10 transition-transform duration-200 hover:scale-95"
          />
          <span className="font-luckiest text-3xl pt-2 whitespace-nowrap">{statsData.achievements}</span>
          <span className="text-sm whitespace-nowrap break-words">Unlocked Achievements</span>
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
        {highlightedMatches.slice(0, 3).map((match) => {
          const winner = match.player1.score > match.player2.score ? match.player1 : match.player2;
          const loser = match.player1.score > match.player2.score ? match.player2 : match.player1;
          
          return (
            <div
              key={match.id}
              className="relative flex opacity-95 flex-col justify-center items-center space-y-5 h-[330px] w-[380px] text-white bg-no-repeat bg-contain bg-center flex-shrink-0"
              style={{ backgroundImage: `url('/images/setting-assests/Vector.svg')` }}>
              <div className="absolute top-4 right-4 flex flex-col items-center">
                <img
                  src="/images/setting-assests/time.svg"
                  alt="time"
                  className="w-8 h-8 transition-transform duration-200 hover:scale-95"
                />
                <span className="font-luckiest text-sm pt-1 whitespace-nowrap">{match.time}</span>
              </div>
              <div className="bg-[#6EC2B4] w-[250px] rounded-full h-[60px] flex items-center gap-2">
                <div className="relative w-[60px] h-[60px] flex-shrink-0">
                  <img
                    src="/images/home-assests/cir-online.svg"
                    className="absolute inset-0 w-full h-full z-0"
                    alt="Online circle"
                  />
                  <img
                    src={winner.avatar}
                    className="absolute inset-[8px] w-11 h-11 rounded-full object-cover z-10"
                    alt="Avatar"
                  />
                </div>
                <h2 className="text-lg font-bold truncate max-w-[120px] text-white">{winner.name.toUpperCase()}</h2>
                <span className="text-lg font-bold ml-auto pr-4 text-white">{winner.score}</span>
              </div>
              <div className="bg-[#828282] w-[250px] rounded-full h-[60px] flex items-center gap-2 bg-opacity-65">
                <div className="relative w-[60px] h-[60px] flex-shrink-0">
                  <img
                    src="/images/home-assests/cir-online.svg"
                    className="absolute inset-0 w-full h-full z-0"
                    alt="Online circle"
                  />
                  <img
                    src={loser.avatar}
                    className="absolute inset-[8px] w-11 h-11 rounded-full object-cover z-10"
                    alt="Avatar"
                  />
                </div>
                <h2 className="text-lg font-bold truncate max-w-[120px] text-white">{loser.name.toUpperCase()}</h2>
                <span className="text-lg font-bold ml-auto pr-4 text-white">{loser.score}</span>
              </div>
            <div className="w-14 h-14 absolute top-1 left-10 flex flex-col items-center ">
              {(() => {
                const GameModeComponent = match.type === 'SPEED' ? Speed :
                  match.type === 'GOLD' ? Gold :
                  match.type === 'CLASSIC' ? Classic :
                  match.type === 'VANISH' ? Vanish : null;
                return GameModeComponent ? <GameModeComponent /> : null;
              })()}
            </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
          <p className="text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
};