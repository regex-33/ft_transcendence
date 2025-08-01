import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';




export const Sidebar: ComponentFunction = () => {
    return (
    <aside className="w-[32%] h-full   p-2  border-r border-black">
    <div class="w-[340px] h-[740px] bg-[#5E9CAB]  rounded-xl  bg-opacity-35 text-white  p-3 shadow-lg relative ml-9 mt-10">

        <div class="flex flex-col items-center text-center w-full  pr-20">

            <div class="flex items-center justify-center gap-2 w-full">
                <div class="relative w-[85px] h-[85px] flex-shrink-0">
                <img
                    src="/images/home-assests/cir-online.svg"
                    class="absolute inset-0 w-full h-full z-0"
                    alt="Online circle"
                />
                <img
                    src="https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg"
                    class="absolute inset-[10px] w-16 h-16 rounded-full object-cover z-10"
                    alt="Avatar"
                />
                </div>
                <h2 class="text-2xl font-bold truncate max-w-[120px]">YOUSSEF</h2>
            </div>


            <button
                class="mt-2 flex items-center justify-between px-6 py-1 w-[180px] text-white bg-no-repeat bg-contain bg-center"
                style="background-image: url('/images/setting-assests/bg-add-friends.svg')"
            >
                <span class="font-luckiest text-base pt-2 whitespace-nowrap">ADD AS FRIEND</span>
                <img
                src="/images/setting-assests/plus-friends.svg"
                alt="Add"
                class="w-8 h-8 ml-4 transition-transform duration-200 hover:scale-95"
                />
            </button>
        </div>


        <div class="mt-16 space-y-4 pl-7">
            <h3 class="text-lg font-bold mb-2">About me</h3>
            <p class="text-sm text-gray-200 break-words">
            I am a 1337 student, passionate about coding and always eager
             to learn new technologies. I love working on challenging projects
              and collaborating with others to create innovative solutions.
            </p>
        </div>


        <div class="mt-6 space-y-2 text-sm pl-5">
            <div class="flex items-center gap-2">
                <img
                src="/images/setting-assests/birthday.svg"
                alt="Add"
                class="w-8 h-8"
                />
                <span className="text-white">20/08/2006</span>
            </div>

            <div class="flex items-center gap-2">
                <img
                src="/images/setting-assests/location.svg"
                alt="Add"
                class="w-8 h-8"
                />
            <span className="text-white">Morocco</span>
            </div>
            
        </div>
        </div>

        </aside>
    );

}