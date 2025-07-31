import React, { useEffect, useRef, useState } from 'react';
 
type Player = {
  id: number;
  name: string;
  avatar: string;
  online: boolean;
};

const players: Player[] = [
  { id: 1, name: 'youssef', avatar: 'https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg' , online: false},
  { id: 2, name: 'najib', avatar: 'https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg', online: true },
  { id: 3, name: 'bader', avatar: 'https://cdn.intra.42.fr/users/3396ca0db7588fdad017bae90c330b25/bchanaa.jpeg' , online: false},
  { id: 4, name: 'khadija', avatar: 'https://cdn.intra.42.fr/users/3628ea8845c92cadb4a3a0dc17b3bc86/khmessah.jpeg', online: true},
  { id: 5, name: 'youssef', avatar: 'https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg' , online: false},
  { id: 6, name: 'najib', avatar: 'https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg', online: true },
  { id: 7, name: 'bader', avatar: 'https://cdn.intra.42.fr/users/3396ca0db7588fdad017bae90c330b25/bchanaa.jpeg' , online: false},
  { id: 8, name: 'khadija', avatar: 'https://cdn.intra.42.fr/users/3628ea8845c92cadb4a3a0dc17b3bc86/khmessah.jpeg', online: false},
  { id: 9, name: 'youssef', avatar: 'https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg' , online: false},
  { id: 10, name: 'najib', avatar: 'https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg', online: true },
  { id: 11, name: 'bader', avatar: 'https://cdn.intra.42.fr/users/3396ca0db7588fdad017bae90c330b25/bchanaa.jpeg' , online: false},
  { id: 12, name: 'khadija', avatar: 'https://cdn.intra.42.fr/users/3628ea8845c92cadb4a3a0dc17b3bc86/khmessah.jpeg', online: true},
  { id: 13, name: 'youssef', avatar: 'https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg' , online: true},
  { id: 14, name: 'najib', avatar: 'https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg', online: true },
  { id: 15, name: 'bader', avatar: 'https://cdn.intra.42.fr/users/3396ca0db7588fdad017bae90c330b25/bchanaa.jpeg' , online: false},
  { id: 16, name: 'khadija', avatar: 'https://cdn.intra.42.fr/users/3628ea8845c92cadb4a3a0dc17b3bc86/khmessah.jpeg', online: false},
  { id: 17, name: 'youssef', avatar: 'https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg' , online: true},
  { id: 18, name: 'najib', avatar: 'https://cdn.intra.42.fr/users/7b89b520749f54897c4655ec73c682dc/namoussa.jpeg', online: true },
  { id: 19, name: 'bader', avatar: 'https://cdn.intra.42.fr/users/3396ca0db7588fdad017bae90c330b25/bchanaa.jpeg' , online: false},
  { id: 20, name: 'aghlimi', avatar: 'https://cdn.intra.42.fr/users/0def1edb57ee46b40a74d567fb9e60aa/aghlimi.jpg', online: false},
  { id: 21, name: 'aghlimi', avatar: 'https://cdn.intra.42.fr/users/0def1edb57ee46b40a74d567fb9e60aa/aghlimi.jpg', online: false},
  { id: 22, name: 'aghlimi', avatar: 'https://cdn.intra.42.fr/users/0def1edb57ee46b40a74d567fb9e60aa/aghlimi.jpg', online: true},
  { id: 23, name: 'aghlimi', avatar: 'https://cdn.intra.42.fr/users/0def1edb57ee46b40a74d567fb9e60aa/aghlimi.jpg', online: true},
  { id: 24, name: 'aghlimi', avatar: 'https://cdn.intra.42.fr/users/0def1edb57ee46b40a74d567fb9e60aa/aghlimi.jpg', online: false},
  { id: 25, name: 'mel-hadd', avatar: 'https://cdn.intra.42.fr/users/ece23d91bc116507cd6f0d31e91c0105/mel-hadd.JPG', online: true},
  { id: 26, name: 'mel-hadd', avatar: 'https://cdn.intra.42.fr/users/ece23d91bc116507cd6f0d31e91c0105/mel-hadd.JPG', online: false},
];


export function Search() {
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
     
    const modalRef = useRef<HTMLDivElement>(null);
    
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
    
  return (
     <div>
          <div className="min-w-0">
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 md:px-3 py-1 overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95">
              <img src="/home-assests/search-icon.svg" alt="search" className="w-6 h-6 md:w-10 md:h-10" />
            </button>
          </div>

          {showSearch && (
  <div className="fixed inset-0 bg-[#193D47] bg-opacity-70 flex justify-center items-center z-50">
    <div
      ref={modalRef}
      className="bg-[#64B0C5] w-[500px] p-2 h-[450px] rounded-3xl shadow-lg relative"
    >
      <div className="relative w-full">
        <span className="absolute top-[7px] left-0 flex items-center pl-3">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search for a player"
          className="w-full px-10 pb-3 mb-1 pt-2 placeholder-[#D3DDE3] border-b-[1px] border-[#FFFFFF] bg-transparent text-white focus:outline-none"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
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
                      ? 'url("/home-assests/cir-online.svg")'
                      : 'url("/home-assests/cir-offline.svg")'
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
}