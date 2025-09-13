export default function Online({data_friend, name_friend}) {
    return (
        <div>
            <div
                className="absolute top-14% inset-0 bg-sky-custom/35 w-5% h-82%  rounded-lg object-cover  mx-1% overflow-y-auto"  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#659EAC transparent',
                    msOverflowStyle: 'auto',
                  }}>
               <GetUser data_friend = {data_friend} name_friend = {name_friend}/>
            </div>
            <img src='images/chat/icon_online.png' alt="icon online" className=" absolute top-12% mx-4% h-2.5% w-1.5% "></img>
            <div
                className="absolute top-14% right-0 bg-sky-custom/35 w-5% h-82%  rounded-lg object-cover  mx-1% overflow-y-auto"  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#4D8995 transparent',
                    msOverflowStyle: 'auto',
                  }}>
                <GetUser data_friend = {data_friend} name_friend = {name_friend}/>
            </div>
            <img src='images/chat/icon_online.png' alt="icon online" className=" absolute top-12% mx-97% h-2.5% w-1.5%"></img>
        </div>
    )
}

export function GetUser({ data_friend, name_friend }) {
    if (!Array.isArray(data_friend)){
        console.log("map khawian")
        return null;
    } 
    return (
      <div className="flex flex-col items-center gap-4">
        {data_friend.map((user) => (
          <button
            key={user.id}
            onClick={() =>
              name_friend({
                id: user.id,
                name: user.name,
                image: user.image
              })
            }
            className="w-60% h-60% rounded-full flex items-center justify-center overflow-hidden hover:drop-shadow-[0_0_10px_white]"
          >
            <img
              className="w-full h-full object-cover rounded-full"
              src={user.image || '/images/chat/default-avatar.png'}
              alt={user.name}
            />
          </button>
        ))}
      </div>
    );
  }
  