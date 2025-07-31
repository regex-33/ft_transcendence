import { useEffect } from "../../hooks/useEffect";
import { useRef } from "../../hooks/useRef";
import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";


const friends = [
  {  avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", online: false },
  {  id:1, avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", online: true },
  {  id:2, avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", online: true },
  {  id:3, avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", online: false },
  {  id:4, avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", online: true },
  {  id:5, avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", online: false },
  {  id:6, avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", online: true },
    {  avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", online: false },
  {  id:1, avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", online: true },
    {  avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", online: true },
  {  id:1, avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", online: true },
  {  id:1, avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", online: false },
  {  id:1, avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", online: true },
  {  id:1, avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", online: false },
];


function FriendItem({ friend }: { friend: typeof friends[0] }) 
{

  BiquadFilterNode;
  const cadreBg = friend.online ? "/images/home-assests/cir-online.svg" : "/images/home-assests/cir-offline.svg";

  
  return (
  <div className="flex flex-row items-center w-16 translate-y-14  ">
  <div className="w-20 h-20 relative flex items-center 
      justify-center bg-no-repeat bg-contain" style={{ backgroundImage: `url(${cadreBg})` }}>
  <img
    src={friend.avatar}
    alt="Friend Avatar"
    className="w-12 h-12 rounded-full object-cover relative -top-[7px] "
  />
</div>

    </div>
  );
}


function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}


export const ChatPanel: ComponentFunction = () => {
  const friendColumns = chunk(friends, 2);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <aside className="w-[25%] p-2 flex flex-col gap-4">
      <div className="relative w-full">
        <button
          className="h-[50px] w-[260px] py-2 bg-no-repeat bg-contain 
            bg-center text-white relative left-16 top-3"
          style={{ backgroundImage: "url('/images/home-assests/bg-gameMode.svg')" }}
        >
          <span className="font-irish font-bold tracking-wide text-sm sm:text-base md:text-2xl">
            Friends Online
          </span>
        </button>
        <div
          className="relative rounded-lg h-[330px] w-[330px] 
            bg-no-repeat bg-center bg-[length:330px_330px] translate-x-9 overflow-hidden"
          style={{ backgroundImage: "url('/images/home-assests/bg-online.svg')" }}
        >
          <div
            ref={scrollContainerRef}
            className="absolute inset-0 ml-4 pr-4 max-w-[300px] overflow-x-auto overflow-y-hidden scrollbar-hide"
          >
            <div className="flex gap-7 p-4">
              {friendColumns.map((group, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-4  items-center min-w-[60px]">
                  {group.map((friend) => (
                    <FriendItem friend={friend} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

