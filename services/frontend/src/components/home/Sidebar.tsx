import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";

type Match = {
  time: string;
  score: string;
  type: 'CLASSIC' | 'SPEED' | 'VANISH' | 'GOLD';
  status: 'LIVE' | 'LOCKED' | 'DONE';
  team1Avatars: string[]; 
  team2Avatars: string[];
};


export const Sidebar: ComponentFunction = () => {

const matches: Match[] = [
  {
    time: '13:02',
    score: '1:1',
    type: 'CLASSIC',
    status: 'LOCKED',
    team1Avatars: ['https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg'],
    team2Avatars: ['https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg'],
  },
  {
    time: '13:02',
    score: '3:0',
    type: 'SPEED',
    status: 'LIVE',
    team1Avatars: ['https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg'],
    team2Avatars: [
      'https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg',
      'https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg',
    ],
  },
  {
    time: '13:02',
    score: '2:5',
    type: 'CLASSIC',
    status: 'LOCKED',
    team1Avatars: ['https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg', 'https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg'],
    team2Avatars: ['https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg', 'https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg'],
  },
  // {
  //   time: '13:02',
  //   score: '3:1',
  //   type: 'CLASSIC',
  //   status: 'LOCKED',
  //   team1Avatars: ['https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg', 'https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg'],
  //   team2Avatars: ['https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg'],
  // },
  // {
  //   time: '13:02',
  //   score: '2:4',
  //   type: 'CLASSIC',
  //   status: 'LIVE',
  //   team1Avatars: ['https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg'],
  //   team2Avatars: ['https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg'],
  // },
];



const MAX_MATCHES = 5;
const filledMatches: (Match | null)[] = [...matches.slice(0, MAX_MATCHES)];

  while (filledMatches.length < MAX_MATCHES) {
    filledMatches.push(null);
  }

  const getTypeColor = (type: Match['type']) => {
    switch (type) {
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

  const getBackgroundColor = (status: Match['status']) => 
  {
    switch (status) {
      case 'LIVE':
        return 'bg-[#6AE4E8] ';
      case 'LOCKED':
        return 'bg-[#6AE4E8]  bg-opacity-55';
      default:
        return 'bg-[#3A3A3A]';
    }
  };

  return (
<aside className="w-full max-w-[320px] sm:max-w-[280px] md:max-w-[290px] p-4  flex flex-col gap-5">
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
            <span className="relative -top-3 text-sm">{match.time}</span>
            {match.status === "LIVE" && (
              <div className="py-0.5 ml-0">
                <img src="/images/home-assests/live.svg" alt="Live" className="w-10 h-10" />
              </div>
            )}
            {match.status === "LOCKED" && (
              <div className="py-0.5 ml-1">
                <img src="/images/home-assests/locked.svg" alt="Locked" className="w-10 h-10" />
              </div>
            )}
            <span className={`${getTypeColor(match.type)} font-luckiest text-sm relative -top-3 left-2`}>
              {match.type}
            </span>
          </div>

          <div className="flex justify-between items-center px-2 py-1 relative -top-5 space-x-2">
            <div className="flex flex-col space-y-0">
              {match.team1Avatars.map((avatar, idx) => (
                <div className="relative w-11 h-11" key={idx}>
                  <img src="/images/home-assests/cir-offline.svg" className="absolute inset-0 w-full h-full z-0" />
                  <img
                    src={avatar}
                    className="absolute inset-[4px] w-[35px] h-[35px] rounded-full object-cover z-10"
                    alt={`Team1-P${idx + 1}`}
                  />
                </div>
              ))}
            </div>

            <span className="text-3xl font-luckiest relative right-1 top-1">{match.score}</span>

            <div className="flex flex-col space-y-0">
              {match.team2Avatars.map((avatar, idx) => (
                <div className="relative w-11 h-11" key={idx}>
                  <img src="/images/home-assests/cir-offline.svg" className="absolute inset-0 w-full h-full z-0" />
                  <img
                    src={avatar}
                    className="absolute inset-[4px] w-[35px] h-[35px] rounded-full object-cover z-10"
                    alt={`Team2-P${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          key={index}
          className="rounded-[20px] h-[84px] flex items-center justify-center text-[#C7C6C6]] bg-[#6AE4E8] opacity-55 w-full max-w-[270px]"
        >
          <span className="font-rowdies text-2xl font-bold ">
          No Match Found!
          </span>
        </div>
      )
    )}
  </div>
</aside>


  );
}



