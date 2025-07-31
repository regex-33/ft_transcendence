import { useState } from "../../hooks/useState";
import { useRef } from "../../hooks/useRef";
import { useEffect } from "../../hooks/useEffect";
import { ComponentFunction } from "../../types/global";
import { h } from "../../vdom/createElement";

type Player = {
  id: number;
  name: string;
  avatar: string;
  online: boolean;
};

const players: Player[] = [
  { id: 1, name: "youssef", avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", online: false },
  { id: 2, name: "najib", avatar: "https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg", online: true },
  { id: 3, name: "bader", avatar: "https://cdn.intra.42.fr/users/3396ca0db7588fdad017bae90c330b25/bchanaa.jpeg", online: false }
];

export const Search: ComponentFunction = () => {
const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
     
    const modalRef = useRef<HTMLDivElement | null>(null);
    
    const trimmed = searchQuery.trim().toLowerCase();
    const isSearching = trimmed.length > 0;

    const defaultPlayers = players
      .filter(p => p.online)
      .concat(players.filter(p => !p.online))
      .slice(0, 5);
    
    const filteredPlayers = players.filter(p =>
      p.name.toLowerCase().includes(trimmed)
    );
    
    
    let displayPlayers: typeof players = [];
    let showNoResults = false;
    
    if (!isSearching) {
      displayPlayers = defaultPlayers;
    } else if (filteredPlayers.length > 0) {
      displayPlayers = filteredPlayers;
    } else {
      showNoResults = true;
    }
    
    
    
    const handleCloseSearch = () => {
      setShowSearch(false);
      setSearchQuery('');
    };
    
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          handleCloseSearch();
        }
      };
    
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

  // Function to handle search button click
  const onSearchInput = () => {
    setShowSearch(true);
  };

  return (
    <div>
      <div className="min-w-0">
        <button
          onClick={onSearchInput}
          className="flex items-center gap-2 md:px-3 py-1 overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95"
        >
          <img src="/images/home-assests/search-icon.svg" alt="search" className="w-6 h-6 md:w-10 md:h-10" />
        </button>
      </div>
      {showSearch && (
        <div className="fixed inset-0 bg-[#193D47] bg-opacity-70 flex justify-center items-center z-50">
          <div
            ref={modalRef}
            className="bg-[#64B0C5] w-[500px] p-2 h-[450px] rounded-3xl shadow-lg relative focus:outline-none"
          >
            <div className="relative w-full">
              <span className="absolute top-[7px] left-0 flex items-center pl-3">🔍</span>
              <input
                type="text"
                placeholder="Search for a player"
                className="w-full px-10 pb-3 mb-1 pt-2 placeholder-[#D3DDE3] border-b-[1px] border-[#FFFFFF] bg-transparent text-white focus:outline-none"
                value={searchQuery}
                onInput={(e: InputEvent) =>
                  setSearchQuery((e.target as HTMLInputElement).value)
                }
                spellCheck={false}
              />
            </div>

            {showNoResults ? (
              <div className="text-3xl font-irish text-gray-100 mt-40 ml-24">
                No players found!
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-300">
                <ul className="space-y-3">
                  {displayPlayers.map(player => (
                    <li
                      key={player.id}
                      className="flex ml-5 w-[420px] items-center gap-3 pb-1 border-b border-[#91C7D6]"
                    >
                      <div
                        className="relative w-14 h-14 flex items-center justify-center bg-no-repeat bg-contain"
                        style={{
                          backgroundImage: player.online
                            ? 'url("/images/home-assests/cir-online.svg")'
                            : 'url("/images/home-assests/cir-offline.svg")'
                        }}
                      >
                        <img
                          src={player.avatar}
                          alt="Friend Avatar"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </div>
                      <span className="font-irish text-white">{player.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
