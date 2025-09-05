import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import ChannelCard from "./ChannelCard";
import { Channel } from "./channel";

interface Props {
  channels: Channel[];
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
}

const ChannelGrid: ComponentFunction = ({ channels, onJoin, onLeave }) => {
  return (
    <div className="grid grid-cols-5 gap-6 p-6">
      {channels.map((channel) => (
        <ChannelCard
          key={channel.id}
          channel={channel}
          onJoin={onJoin}
          onLeave={onLeave}
        />
      ))}
    </div>
  );
};

export default ChannelGrid;
