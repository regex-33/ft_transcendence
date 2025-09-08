import { useEffect } from "../../hooks/useEffect";
import { useRef } from "../../hooks/useRef";
import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { Classic } from "./gameMode/Classic";
import { Speed } from "./gameMode/Speed";
import { Gold } from "./gameMode/Gold";
import { Vanish } from "./gameMode/Vanish";

export const OverviewSettings: ComponentFunction = () => {
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

  return (
    <div>
      <button className="flex flex-row h-[300px] px-5 gap-20 pb-4">
        <button
          className="flex flex-col justify-center items-center w-[180px] text-white bg-no-repeat bg-contain bg-center"
          style={{ backgroundImage: `url('/images/setting-assests/bg-greenOve.svg')` }}>
          <img
            src="/images/setting-assests/gagne.svg"
            alt="Add"
            className="w-8 h-8 transition-transform duration-200 hover:scale-95"
          />
          <span className="font-luckiest text-3xl pt-2 whitespace-nowrap">320</span>
          <span className="text-sm whitespace-nowrap">Matches Won</span>
        </button>
        <button
          className="flex flex-col justify-center items-center w-[180px] text-white bg-no-repeat bg-contain bg-center"
          style={{ backgroundImage: `url('/images/setting-assests/bg-greenOve.svg')` }}>
          <img
            src="/images/setting-assests/star.svg"
            alt="Add"
            className="w-10 h-10 transition-transform duration-200 hover:scale-95"
          />
          <span className="font-luckiest text-3xl pt-2 whitespace-nowrap">200</span>
          <span className="text-sm whitespace-nowrap">Leader board Position</span>
        </button>
        <button
          className="flex flex-col justify-center items-center w-[180px] text-white bg-no-repeat bg-contain bg-center"
          style={{ backgroundImage: `url('/images/setting-assests/bg-greenOve.svg')` }}>
          <img
            src="/images/setting-assests/unlucky.svg"
            alt="Add"
            className="w-10 h-10 transition-transform duration-200 hover:scale-95"
          />
          <span className="font-luckiest text-3xl pt-2 whitespace-nowrap">12</span>
          <span className="text-sm whitespace-nowrap">Matches Losses</span>
        </button>
        <button
          className="flex flex-col justify-center items-center w-[180px] text-white bg-no-repeat bg-contain bg-center"
          style={{ backgroundImage: `url('/images/setting-assests/bg-greenOve.svg')` }}>
          <img
            src="/images/setting-assests/unlocked.svg"
            alt="Add"
            className="w-10 h-10 transition-transform duration-200 hover:scale-95"
          />
          <span className="font-luckiest text-3xl pt-2 whitespace-nowrap">9</span>
          <span className="text-sm whitespace-nowrap break-words">Unlocked Achievements</span>
        </button>
        <button
          className="flex flex-col justify-center items-center w-[180px] text-white bg-no-repeat bg-contain bg-center"
          style={{ backgroundImage: `url('/images/setting-assests/bg-greenOve.svg')` }}>
          <img
            src="/images/setting-assests/sales.svg"
            alt="Add"
            className="w-12 h-12 transition-transform duration-200 hover:scale-95"
          />
          <span className="font-luckiest text-3xl pt-2 whitespace-nowrap">450</span>
          <span className="text-sm whitespace-nowrap">Total Pts</span>
        </button>
      </button>
      
      <div className="-mt-10 pl-9 -space-y-4">
        <h1 className="font-luckiest text-lg pt-2 whitespace-nowrap text-white">HIGHLIGHTED MATCHES</h1>
        <h3 className="pt-2 text-sm text-gray-200">Best matches played</h3>
      </div>
      
      <div className="flex flex-row h-[450px] px-5 gap-12 overflow-x-auto mt-16 ml-0">
        {highlightedMatches.slice(0, 3).map((match) => {
          const winner = match.player1.score > match.player2.score ? match.player1 : match.player2;
          const loser = match.player1.score > match.player2.score ? match.player2 : match.player1;
          
          return (
            <button
              key={match.id}
              className="relative flex opacity-95 flex-col justify-center items-center space-y-5 h-[330px]  w-[380px] text-white bg-no-repeat bg-contain bg-center flex-shrink-0"
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
            <div className="w-14  h-14  absolute top-1 left-10 flex flex-col items-center ">
              {(() => {
                const GameModeComponent = match.type === 'SPEED' ? Speed :
                  match.type === 'GOLD' ? Gold :
                  match.type === 'CLASSIC' ? Classic :
                  match.type === 'VANISH' ? Vanish : null;
                return GameModeComponent ? <GameModeComponent /> : null;
              })()}
            </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};