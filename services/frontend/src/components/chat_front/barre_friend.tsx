import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { useState } from '../../hooks/useState';

interface Friend {
  id: number;
  name: string;
  image: string;
}

interface BarreProps {
  friend: Friend[];
  onSelectFriend: (friend: Friend) => void;
}

export const Barre: ComponentFunction<BarreProps> = ({ friend, onSelectFriend }) => {
  const [inputV, setInput] = useState<string>("");
  const [friendl, setFriendl] = useState<boolean>(false);

  function getInput(event: Event) {
    const target = event.target as HTMLInputElement;
    setInput(target.value);
    console.log("input is : ", target.value);
  }

  function changeBlock() {
    setFriendl(!friendl);
  }

  return (
    <div>
      <div className="absolute top-[14%] w-[20%] h-[82%] bg-sky-custom1/65 rounded-lg left-[7%]">
        <div className="absolute flex justify-evenly w-full h-[89%] top-[5%]">
          <input 
            className='absolute hover:shadow-lg w-[93%] h-[9%] top-[1%] pl-4 bg-bleu-ver rounded-3xl placeholder:text-[0.9vw] text-bleu-noir/40 focus:outline-none placeholder:text-bleu-noir/40'
            value={inputV}
            placeholder="Search "
            onChange={getInput}
          />
          <button>
            <img 
              src="/images/chat/search.png" 
              alt="search"
              className="absolute h-[4%] top-[4%] ml-[35%]"
            />
          </button>
        </div>
        
        <button 
          onClick={changeBlock} 
          className="absolute top-[17%] hover:shadow-lg w-[40%] left-[5%] hover:bg-sky-custom/70 rounded-xl"
        >
          <h2 className="absolute text-[0.9vw] font-luckiest text-white top-[33%] left-[29%]">
            Friends
          </h2>
          <img src='images/chat/block-list.png' alt='button-block' />
        </button>
        
        <div 
          className="absolute top-[25%] left-[5%] w-[90%] h-[60%] overflow-y-auto" 
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4D8995 transparent',
            msOverflowStyle: 'auto',
          }}
        >
          {friendl && <GetListFriend friends={friend} onSelectFriend={onSelectFriend} />}
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
      {friends.map((user, index) => (
        <button 
          key={index}
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
      ))}
    </div>
  );
};