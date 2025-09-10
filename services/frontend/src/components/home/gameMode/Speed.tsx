import { useEffect } from "../../../hooks/useEffect";
import { h } from '../../../vdom/createElement';
import { useState } from "../../../hooks/useState";
import { ComponentFunction } from "../../../types/global";

export const Speed: ComponentFunction = () => {
    const [starActive, setStarActive] = useState(true)
  let point = 150;
// useEffect(() => {
    if (point === 150)
      setStarActive(true);
    else
      setStarActive(false);
  // }, [point]);
    return (

<div className="flex flex-col items-center text-center w-full max-w-[180px] sm:max-w-[200px]">
  <div className="relative w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] md:w-[140px] md:h-[140px] rounded-full flex items-center justify-center">
    <img
      src={starActive ? "/images/home-assests/green-star.svg" : "/images/home-assests/gray-star.svg"}
      alt={starActive ? "Active Star" : "Inactive Star"}
      className="absolute top-0 left-1 w-6 sm:w-8 md:w-10 z-20"
    />
    <img
      src="/images/home-assests/bg-modes.svg"
      alt="Background"
      className="absolute top-0 left-0 w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] md:w-[140px] md:h-[140px] z-10 rounded-full"
    />
    <img
      src="/images/home-assests/speed.svg"
      alt="speed"
      className="cursor-pointer absolute w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 transition-transform duration-200 hover:scale-110"
    />
  </div>
  <span className="text-white font-luckiest text-xs sm:text-sm md:text-lg mt-2">
    SPEED
  </span>
</div>



    );
}