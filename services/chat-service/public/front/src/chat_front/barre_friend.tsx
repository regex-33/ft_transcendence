import {useState, type ChangeEvent } from 'react';
export default function Barre({friend,onSelectFriend}) 
{
    const [inputV,setinput]  = useState("")
    function get_input(event: ChangeEvent<HTMLInputElement>)
    {
        setinput(event.target.value)
        console.log("input is : ", event.target.value)
    }
    const [fiendl,setfriendl] = useState(false)
    function change_block()
    {
      setfriendl(!fiendl)
    }
    return (
        <div>
        <div className="absolute top-[14%] w-[20%] h-[82%] bg-sky-custom1/65 rounded-lg left-7%">
            <div className="absolute  flex justify-evenly  w-full h-[89%] top-[5%]">
                <input 
                  className=' absolute hover:shadow-lg w-93% h-9% top-1% pl-4 bg-bleu-ver rounded-3xl placeholder:text-[0.9vw] text-bleu-noir/40 focus:outline-none placeholder:text-bleu-noir/40'   value={inputV}
                  placeholder="Search "
                onChange={get_input}/>
              <button>
                <img  src="/images/chat/search.png" alt="search"className="absolute h-4% top-4% ml-35%" >
                </img>
              </button>
            </div>
            <button onClick={change_block} className="absolute top-17% hover:shadow-l w-40% left-5% hover:bg-sky-custom/70 rounded-xl">
              <h2 className="absolute text-[0.9vw] font-luckiest text-white top-33% left-29%">Friends</h2>
              <img src='images/chat/block-list.png' alt='button-block'></img>
            </button>
            <div className="absolute top-[25%] left-5% w-[90%] h-[60%] overflow-y-auto" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#4D8995 transparent',
                    msOverflowStyle: 'auto',
                  }}>
            {fiendl && <GetListFriend friends={friend} onSelectFriend={onSelectFriend} />}

          </div>
        </div>
      </div>
    );
  }

function GetListFriend({friends, onSelectFriend}) {
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
            className="rounded-full w-15% h-15%"
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
}
