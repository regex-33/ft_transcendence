import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";

interface Friend {
  id: number;
  username?: string;
  avatar?: string;
  online?: boolean;
  name: string;
  image: string;
}

interface OnlineProps {
  friends: Friend[];
}

export const Online: ComponentFunction<OnlineProps> = ({ friends}) => {
  if (!Array.isArray(friends) || friends.length === 0) return <div>No friends online</div>;

  const onlineFriends = friends.filter(f => f.online);
  return (
    <div className="flex flex-col gap-2 p-2 bg-sky-custom/20 rounded-lg max-h-[80vh] overflow-y-auto">
      {onlineFriends.map(friend => (
        <div
          key={friend.id}
          className="relative w-14 h-14 flex items-center 
                          justify-center bg-no-repeat bg-contain transition-transform duration-200 hover:scale-95"
           style={{
                 backgroundImage: 'url("/images/home-assests/cir-online.svg")',
                  }}
        >
          <img
            src={friend.avatar || '/images/default-avatar.png'}
            alt={friend.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
      ))}
      {onlineFriends.length === 0 && <p className="text-white text-sm">No friends online</p>}
    </div>
  );
};
