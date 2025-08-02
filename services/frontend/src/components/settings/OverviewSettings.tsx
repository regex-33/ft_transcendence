import { useEffect } from "../../hooks/useEffect";
import { useRef } from "../../hooks/useRef";
import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";






export const OverviewSettings: ComponentFunction = () => {
  return (
    <div className="">
    <div  className="flex flex-row  h-[300px] px-5 gap-14 pb-4">
         <button
                className=" flex flex-col justify-center items-center w-[180px] text-white bg-no-repeat bg-contain bg-center"
                style={{ backgroundImage: `url('/images/setting-assests/bg-greenOve.svg')` }}>
                <img
                src="/images/setting-assests/gagne.svg"
                alt="Add"
                className="w-8 h-8  transition-transform duration-200 hover:scale-95"
                />
                <span className="font-luckiest text-3xl pt-2 whitespace-nowrap">320</span>
               <span className=" text-sm  whitespace-nowrap">Matches Won</span>
            </button>
          <button
                className=" flex flex-col justify-center items-center w-[180px] text-white bg-no-repeat bg-contain bg-center"
                style={{ backgroundImage: `url('/images/setting-assests/bg-greenOve.svg')` }}>
                <img
                src="/images/setting-assests/star.svg"
                alt="Add"
                className="w-10 h-10  transition-transform duration-200 hover:scale-95"
                />
                <span className="font-luckiest text-3xl pt-2 whitespace-nowrap">200</span>
               <span className=" text-sm  whitespace-nowrap">Leader board Position</span>
            </button>
            <button
                className=" flex flex-col justify-center items-center w-[180px] text-white bg-no-repeat bg-contain bg-center"
                style={{ backgroundImage: `url('/images/setting-assests/bg-greenOve.svg')` }}>
                <img
                src="/images/setting-assests/unlucky.svg"
                alt="Add"
                className="w-10 h-10  transition-transform duration-200 hover:scale-95"
                />
                <span className="font-luckiest text-3xl pt-2 whitespace-nowrap">12</span>
               <span className=" text-sm  whitespace-nowrap">Matches Losses</span>
            </button>
            <button
                className=" flex flex-col justify-center items-center w-[180px] text-white bg-no-repeat bg-contain bg-center"
                style={{ backgroundImage: `url('/images/setting-assests/bg-greenOve.svg')` }}>
                <img
                src="/images/setting-assests/unlocked.svg"
                alt="Add"
                className="w-10 h-10  transition-transform duration-200 hover:scale-95"
                />
                <span className="font-luckiest text-3xl pt-2 whitespace-nowrap">9</span>
               <span className=" text-sm  whitespace-nowrap break-words">Unlocked Achievements</span>
            </button>
            <button
                className=" flex flex-col justify-center items-center w-[180px] text-white bg-no-repeat bg-contain bg-center"
                style={{ backgroundImage: `url('/images/setting-assests/bg-greenOve.svg')` }}>
                <img
                src="/images/setting-assests/sales.svg"
                alt="Add"
                className="w-12 h-12  transition-transform duration-200 hover:scale-95"
                />
                <span className="font-luckiest text-3xl pt-2 whitespace-nowrap">450</span>
               <span className=" text-sm  whitespace-nowrap">Total Pts</span>
            </button>
    </div>
    <div className="-mt-10 pl-9 -space-y-4 ">
            <h1 className="font-luckiest text-lg pt-2 whitespace-nowrap text-white">HIGHLIGHTED MATCHES</h1>
            <h3 className=" pt-2 text-sm text-gray-200">Best matches played</h3>

      </div>
    </div>
  );
};