import { useEffect } from "../../../hooks/useEffect";
import { h } from '../../../vdom/createElement';
import { useState } from "../../../hooks/useState";
import { ComponentFunction } from "../../../types/global";

export const Speed: ComponentFunction = () => {
  return (
    <div className="flex flex-col items-center text-center w-full max-w-[100px]">
      <div className="relative w-[40px] h-[40px] rounded-full flex items-center justify-center">
        <img
          src="/images/home-assests/green-star.svg"
          alt="Active Star"
          className="absolute top-0 left-0 w-4 z-20"
        />
        <img
          src="/images/home-assests/bg-modes.svg"
          alt="Background"
          className="absolute top-0 left-0 w-[40px] h-[40px] z-10 rounded-full"
        />
        <img
          src="/images/home-assests/speed.svg"
          alt="speed"
          className="cursor-pointer absolute w-5 h-5 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 transition-transform duration-200 hover:scale-110"
        />
      </div>
      <span className="text-white font-luckiest text-xs mt-2">
        SPEED
      </span>
    </div>
  );
}