import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';

import { Channel } from "./channel";


interface Props {
  channel: Channel;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
}




const ChannelCard: ComponentFunction = ({ channel, onJoin, onLeave }) => {
  return (
    <div className="relative w-[200px] h-[280px] rounded-3xl bg-white/10 backdrop-blur-md shadow-lg flex flex-col items-center justify-between p-4">
      {/* Avatar */}
      <div className="relative w-[100px] h-[100px] rounded-full overflow-hidden border-4 border-blue-500 shadow-md">
        <img
          src={channel.image}
          alt={channel.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Channel Info */}
      <div className="text-center mt-4">
        <h2 className="text-lg font-bold text-white uppercase">{channel.name}</h2>
        <p className="text-sm text-gray-300">{channel.members} members</p>
      </div>

      {/* Action Button */}
      <button
        onClick={() =>
          channel.isJoined ? onLeave(channel.id) : onJoin(channel.id)
        }
        className={`w-full py-2 rounded-lg mt-4 font-semibold ${
          channel.isJoined
            ? "bg-red-500 hover:bg-red-600"
            : "bg-green-500 hover:bg-green-600"
        } text-white transition`}
      >
        {channel.isJoined ? "Leave" : "Join"}
      </button>
    </div>
  );
};

export default ChannelCard;
