import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import Header from "./Header";
import ChannelGrid from "./ChannelGrid";
import { Channel } from "./channel";

const initialChannels: Channel[] = [
  { id: "1", name: "Salvador", members: 14, image: "/images/salvador.png", isPrivate: false, isJoined: false },
  { id: "2", name: "Fair", members: 22, image: "/images/fair.png", isPrivate: true, isJoined: false },
  { id: "3", name: "Smile", members: 22, image: "/images/smile.png", isPrivate: false, isJoined: false },
  { id: "4", name: "Panda", members: 3, image: "/images/panda.png", isPrivate: false, isJoined: false },
  { id: "5", name: "Squid", members: 1, image: "/images/squid.png", isPrivate: true, isJoined: true },
];

export const ChannelsPage: ComponentFunction = () => {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);

  const handleJoin = (id: string) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, isJoined: true } : ch))
    );
  };

  const handleLeave = (id: string) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, isJoined: false } : ch))
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 bg-opacity-90 text-white">
      <Header />
      <ChannelGrid channels={channels} onJoin={handleJoin} onLeave={handleLeave} />
    </div>
  );
};


