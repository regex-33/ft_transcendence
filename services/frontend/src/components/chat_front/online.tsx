import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";

interface Friend {
  id: number;
  name: string;
  image: string;
  online?: boolean;
}

interface GetUserProps {
  data_friend: Friend[];
  name_friend: (friend: Friend) => void;
}

export const GetUser: ComponentFunction<GetUserProps> = ({ data_friend, name_friend }) => {
  if (!Array.isArray(data_friend)) {
    console.log("map khawian");
    return <div></div>;
  } 

  const onlineOnly = data_friend.filter((u) => (typeof u.online === 'boolean' ? u.online : true));

  return (
    <div className="flex flex-col items-center gap-4">
      {onlineOnly.map((user) => (
        <button
          key={user.id}
          onClick={() =>
            name_friend({
              id: user.id,
              name: user.name,
              image: user.image
            })
          }
          className="relative w-[60%] aspect-square flex items-center justify-center hover:drop-shadow-[0_0_10px_white]"
          style={{
            backgroundImage: 'url("/images/home-assests/cir-online.svg")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'contain',
          }}
        >
          <img
            className="w-[70%] h-[70%] object-cover rounded-full"
            src={user.image || '/images/default-avatar.png'}
            alt={user.name}
          />
        </button>
      ))}
    </div>
  );
};

interface OnlineProps {
  data_friend: Friend[];
  name_friend: (friend: Friend) => void;
}

export const Online: ComponentFunction<OnlineProps> = ({ data_friend, name_friend }) => {
    return (
      <div>
          <div
              className="absolute top-14% inset-0 bg-sky-custom/35 w-5% h-82%  rounded-lg object-cover  mx-1% overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#659EAC transparent',
                msOverflowStyle: 'auto',
              }}
            >
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
};