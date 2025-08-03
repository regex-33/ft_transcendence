import { useEffect } from "../../hooks/useEffect";
import { useRef } from "../../hooks/useRef";
import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { Classic } from "./gameMode/Classic";
import { Speed } from "./gameMode/Speed";
import { Gold } from "./gameMode/Gold";
import { Vanish } from "./gameMode/Vanish";

export const MatchHistory: ComponentFunction = () => {
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
        name: "NAJIB",
        avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
        score: 6
      },
      player2: {
        name: "LINA",
        avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
        score: 8
      }
    },
    {
      id: 4,
      time: "18:30",
      type: 'VANISH',
      player1: {
        name: "HAMZA",
        avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
        score: 9
      },
      player2: {
        name: "NAMOUSSA",
        avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
        score: 2
      }
    },
    {
      id: 5,
      time: "19:15",
      type: 'SPEED',
      player1: {
        name: "HASSAN",
        avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
        score: 5
      },
      player2: {
        name: "NADIA",
        avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
        score: 8
      }
    },
    {
      id: 6,
      time: "20:45",
      type: 'GOLD',
      player1: {
        name: "KARIM",
        avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
        score: 6
      },
      player2: {
        name: "SARA",
        avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
        score: 4
      }
    }
  ];

    return (
           <div className="grid grid-cols-3  h-[650px] px-5  overflow-x-auto mt-14">
            {highlightedMatches.slice(0, 6).map((match, index) => {
              const winner = match.player1.score > match.player2.score ? match.player1 : match.player2;
              const loser = match.player1.score > match.player2.score ? match.player2 : match.player1;
              
              return (
                    <button
                      key={`${match.id}-${index}`}
                      className="relative flex opacity-95 flex-col justify-center items-center space-y-5 h-[330px] w-[350px] text-white bg-no-repeat bg-contain bg-center flex-shrink-0"
                      style={{ backgroundImage: `url('/images/setting-assests/Vector.svg')` }}>
                  <div 
                    className="absolute inset-0 bg-no-repeat bg-contain bg-center"
                    style={{ backgroundImage: `url('/images/setting-assests/Vector.svg')` }}>
                  </div>
                  <div className="absolute top-2 right-4 flex flex-col items-center z-20">
                    <img
                      src="/images/setting-assests/time.svg"
                      alt="time"
                      className="w-8 h-8 transition-transform duration-200 hover:scale-95"
                    />
                    <span className="font-luckiest text-sm pt-1 whitespace-nowrap">{match.time}</span>
                  </div>
                  <div className="absolute top-3 left-7 w-14 h-14 flex flex-col items-center z-20">
                    {(() => {
                      const GameModeComponent = match.type === 'SPEED' ? Speed :
                        match.type === 'GOLD' ? Gold :
                        match.type === 'CLASSIC' ? Classic :
                        match.type === 'VANISH' ? Vanish : null;
                      return GameModeComponent ? <GameModeComponent /> : null;
                    })()}
                  </div>
                  <div className="bg-[#6EC2B4] w-[250px] rounded-full h-[60px] flex items-center gap-2 z-10">
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
                  <div className="bg-[#828282] w-[250px] rounded-full h-[60px] flex items-center gap-2  bg-opacity-65 z-10">
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
                </button>
              );
            })}
        </div>
    );
};