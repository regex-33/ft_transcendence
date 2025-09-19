import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { useState } from '../../hooks/useState';

interface Friend {
  id: number;
  name: string;
  image: string;
}

interface Message {
  text: string;
  time: string;
  from: number;
  to: number;
}

interface BarreProps {
  friend: Friend[];
  onSelectFriend: (friend: Friend) => void;
  messages: Message[];
  currentUserId: number | null;
}

export const Barre: ComponentFunction<BarreProps> = ({ 
  friend, 
  onSelectFriend, 
  messages, 
  currentUserId 
}) => {
  const [inputV, setInput] = useState<string>("");
  const [friendl, setFriendl] = useState<boolean>(false);
  const [search, setsearch] = useState<boolean>(false);

  const friendsArray = Array.isArray(friend) ? friend : [];
  const friendsWithConversations = friendsArray.filter(f => {
    return messages.some(msg => 
      (msg.from === currentUserId && msg.to === f.id) || 
      (msg.from === f.id && msg.to === currentUserId)
    );
  });

  const filteredFriends = friendsArray.filter(f => {
    const friendName = f.name ? String(f.name).toLowerCase() : "";
    const searchValue = inputV ? String(inputV).toLowerCase() : "";
    return friendName.includes(searchValue);
  });

  function getInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (target) {
      setInput(target.value || ""); 
    }
  }

  function changeBlock() {
    setFriendl(!friendl);
    if (!friendl) {
      setsearch(false);
    }
  }

  function handleSearchClick() {
    setsearch(true);
    setFriendl(false);
  }

  function handleFriendSelect(user: Friend) {
    onSelectFriend(user);
    setInput("");
  }

  return (
    <div>
      <div className="absolute top-[14%] w-[20%] h-[82%] bg-sky-custom1/65 rounded-lg left-[7%]">
              <div className="absolute flex justify-evenly w-full h-[89%] top-[5%]">
                    <input 
                      className='absolute hover:shadow-lg w-[93%] h-[9%] top-[1%] pl-4 bg-bleu-ver rounded-3xl placeholder:text-[0.9vw] text-bleu-noir/40 focus:outline-none placeholder:text-bleu-noir/40'
                      value={inputV}
                      placeholder="Search all friends"
                      onChange={getInput}
                      onClick={handleSearchClick}
                    />
                    <button onClick={handleSearchClick}>
                        <img 
                          src="/images/chat/search.png" 
                          alt="search"
                          className="absolute h-[4%] top-[4%] ml-[35%]"
                        />
                    </button>
              </div>

              {search && !friendl && (
                <div className="absolute top-[16%] h-84% w-full bg-white/20 rounded-xl overflow-y-auto"style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#4D8995 transparent',
                            msOverflowStyle: 'auto',
                          }}>
                    <button
                      onClick={() => setsearch(false)}
                      className="absolute top-2 right-2 z-10 w-6 h-6 bg-red-500/70 hover:bg-red-500
                                rounded-full flex items-center justify-center transition-all 
                                hover:scale-110 active:scale-95">
                      <span className="text-white text-sm font-bold">×</span>
                    </button>

                    <div className="absolute top-5% rounded-l z-50 w-100% h-100%">
                      {filteredFriends.length > 0 ? (
                        filteredFriends.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleFriendSelect(user)}
                            className="flex items-center gap-3 p-3 transition-all 
                                      hover:border hover:border-white hover:bg-white/10 
                                      focus:outline-none active:scale-95 w-100% h-[10%]">
                                <img
                                  className="rounded-2xl w-10% h-70%"
                                  src={user.image}
                                  alt={user.name}
                                />
                                <span className="text-sm font-bold font-poppins text-white text-[1vw]">
                                  {user.name}
                                </span>
                          </button>
                        ))
                      ) : (
                          <div className="p-3 text-white/60 text-center">
                            No friends found
                          </div>
                      )}
                    </div>
                </div>
              )}

              {!search && (
                  <button 
                    onClick={changeBlock} 
                    className="absolute top-[17%] hover:shadow-lg w-[40%] left-[5%] hover:bg-sky-custom/70 rounded-xl"
                  >
                        <h2 className="absolute text-[0.9vw] font-luckiest text-white top-[33%] left-[12%]">
                        Messages({friendsWithConversations.length})
                        </h2>
                        <img src='images/chat/block-list.png' alt='button-block' />
                  </button>
              )}

              <div 
                className="absolute top-[25%] left-[5%] w-[90%] h-[60%] overflow-y-auto" 
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#4D8995 transparent',
                  msOverflowStyle: 'auto',
                }}
              >
                    {friendl && (
                      <GetListFriend 
                        friends={friendsWithConversations}
                        onSelectFriend={handleFriendSelect} 
                      />
                    )}
              </div>
      </div>
    </div>
  );
};

interface GetListFriendProps {
  friends: Friend[];
  onSelectFriend: (friend: Friend) => void;
}

export const GetListFriend: ComponentFunction<GetListFriendProps> = ({ friends, onSelectFriend }) => {
  return (
    <div>
      {friends.length > 0 ? (
        friends.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectFriend(user)}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all 
                       hover:border hover:border-white hover:bg-white/10 
                       focus:outline-none active:scale-95"
          >
            <img
              className="rounded-full w-[15%] h-[15%]"
              src={user.image}
              alt={user.name}
            />
            <span className="text-sm font-bold font-poppins text-white text-[1vw]">
              {user.name}
            </span>
          </button>
        ))
      ) : (
        <div className="p-3 text-white/60 text-center text-sm">
          No conversations yet.<br/>
          Use search to find friends and start chatting!
        </div>
      )}
    </div>
  );
};