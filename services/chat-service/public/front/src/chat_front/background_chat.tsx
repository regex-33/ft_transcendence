import { useEffect, useRef, useState } from 'react';
import BChat from '../src-image/backg_chat.png';
import Online from './online';
import Barre from './barre_friend'

export default function Bchat() {
  const socket = useRef(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [id, setId] = useState(null);
  const heartbeatInterval = useRef(null);
  const [friends, setFriends] = useState([]);
  const [active, setActive] = useState(false);
  const [nameFriend, setNameFriend] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  useEffect(() => {
    socket.current = new WebSocket('ws://localhost:8002/ws/chat');
    socket.current.onopen = async () => {
      console.log("WebSocket connected");

      try {
        const resUser = await fetch('http://localhost:8002/api/me', {
          credentials: 'include',
          method: "GET",
        });
        if (!resUser.ok) throw new Error('Cannot fetch user');
        const user = await resUser.json();
        console.log("user us : ", user)
        setId(user.id);

        const resFriends = await fetch('http://localhost:8002/api/friends', {
          method: 'GET',
          credentials: 'include',
        });
        
        const friendsList = await resFriends.json();
        console.log("friend is : ", friendsList)
        setFriends(friendsList);
        socket.current.send(JSON.stringify({ type: 'user-info', ...user, friends: friendsList }));

        const resHistory = await fetch(`http://localhost:8002/api/messages/${user.id}`);
        const history = await resHistory.json();
        const normalized = Array.isArray(history)
          ? history.map(m => ({
              text: m.text,
              time: new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
              from: Number(m.fromId),
              to: Number(m.toId),
            }))
          : [];
        setMessages(normalized);

      } catch (err) {
        console.error("---> ",err);
      }

      heartbeatInterval.current = setInterval(() => {
        if (socket.current.readyState === WebSocket.OPEN) {
          socket.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'message') {
        setMessages(prev => [...prev, {
          text: data.message,
          time: data.time,
          from: Number(data.from),
          to: Number(data.to),
        }]);
      }

      if (data.type === 'pong') return;

      if (data.type === 'status') {
        if (data.online) setFriends(data.online);
        if (data.offline) {
          setFriends(prev => prev.filter(f => !data.offline.some(off => off.id === f.id)));
        }
      }
    };

    socket.current.onclose = () => console.log('Disconnected from server');
    socket.current.onerror = (error) => console.log('WebSocket error', error);

    return () => {
      clearInterval(heartbeatInterval.current);
      socket.current.close();
    };
  }, []);

  async function sendMessage(info) {
    if (socket.current && message.trim() !== '') 
    {
      const data = JSON.stringify({ type: 'message', message: message, from: info.from, to: info.to });
      const resBlocked = await fetch(`http://localhost:8002/api/blocked/${info.to}`, {
        method: 'GET',
        credentials: 'include',
      });
      const blockedsList = await resBlocked.json();
      if(blockedsList.status === 'blocked')
      {
        setIsBlocked(true);
        return 
      }
      else {
        setIsBlocked(false);
      }
      console.log("blocked is : ", blockedsList.status)
      socket.current.send(data);
      setMessage('');
    }
  }

  return (
    <div>
      <div>
        {!active && (
          <button className='absolute top-13% left-1% h-5% w-5%' onClick={() => setActive(true)}>
            <img src='images/chat/friend.png' alt='friend' />
          </button>
        )}
        {active && <Online data_friend={friends} name_friend={setNameFriend} />}
        <Barre friend={friends} onSelectFriend={setNameFriend} />
      </div>

      <div className="absolute w-65% h-82% top-14% left-28% m-0.1%">
        <img className='w-full h-full object-cover rounded-2xl' src={BChat} alt='background chat' />


        <div className="absolute w-full h-6% top-0.1% bg-bleu-custom/50 z-10 rounded-t-xl hover:shadow-xl transition-all">
          <h2 className='ml-5% top-15% absolute font-poppins font-semibold w-full h-full text-white'>
            {nameFriend ? nameFriend.name : ""}
          </h2>
          <img className='absolute top-3% rounded-3xl h-100%' src={nameFriend ? nameFriend.image : "/images/chat/lock.png"} alt='avatar' />
          <img src='/images/chat/icon_friend.png' alt='icon friend' className='relative top-6% w-2.5% h-80% ml-96.5%' />
        </div>

        <div className="absolute top-8% left-2% right-2% bottom-12% overflow-y-auto flex flex-col gap-2"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#3BACCE transparent', msOverflowStyle: 'auto' }}
        >
          {messages
            .filter(m => (m.from === id && m.to === nameFriend?.id) || (m.from === nameFriend?.id && m.to === id))
            .map((m, i) => (
              <h5 key={i} className={`px-3 py-1 text-gray-50 rounded-xl w-fit inline-block ${m.from === id ? 'self-end bg-chat-send' : 'self-start bg-chat-revice'}`}>
                <span>{m.text}</span>
                <br />
                <span className="text-xs opacity-70">{m.time}</span>
              </h5>
          ))}
        </div>

        <div className="absolute left-2% w-97% h-7% bottom-2% transition-all flex">
          {nameFriend && (
            <>
              {isBlocked && (
                <div className="absolute -top-90% left-1%  bg-teal-500 text-fuchsia-50 px-4 py-2 rounded-lg shadow-lg">
                  User blocked. You cannot send messages to this user.
                </div>
              )}
              <input
                className='w-full h-full rounded-3xl px-3 hover:shadow-lg opacity-40 placeholder:text-[1vw] focus:outline-none'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage({ from: id, to: nameFriend.id })}
                placeholder="Type your message..."
              />
              <button onClick={() => sendMessage({ from: id, to: nameFriend.id })}>
                <img className='absolute left-96% top-23% w-3% h-50%' src='images/chat/send-msg.png' alt="icon send" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
