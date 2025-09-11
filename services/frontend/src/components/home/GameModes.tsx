import { Classic } from "./gameMode/Classic";
import { Speed } from "./gameMode/Speed";
import { Vanish } from "./gameMode/Vanish";
import { Gold } from "./gameMode/Gold";
import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";

export const GameModes: ComponentFunction = () => {
  return (
<div className="w-full max-w-7xl mx-auto  sm:px-1 lg:px-8  translate-y-20">
  
 <button
  className="w-full max-w-[220px] sm:max-w-[180px] md:max-w-[200px] py-2  md:translate-x-4 sm:py-1 bg-no-repeat bg-contain bg-center text-white flex items-center justify-center"
  style={{ backgroundImage: "url('/images/home-assests/bg-gameMode.svg')" }}
>
  <span className="font-irish font-bold tracking-wide text-sm sm:text-base md:text-sm">
    Games mode
  </span>
</button>


<div className="bg-black bg-opacity-25 px-4 sm:px-10 py-9 sm:py-7 rounded-[40px] w-full mt-4 overflow-hidden">
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
    <Classic />
    <Speed />
    <Vanish />
    <Gold />
  </div>
</div>


 <div className="bg-[#59B0B6] bg-opacity-60 px-4 sm:px-6 py-4 sm:py-6 rounded-[30px] w-full mt-4">
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
    {['classicPts', 'speedPts', 'vanishPts', 'goldPts'].map((bg, i) => (
      <button
        key={i}
        className="w-full max-w-[120px] sm:max-w-[140px] md:max-w-[150px] h-14 bg-no-repeat bg-contain bg-center transition-transform duration-200 hover:scale-110"
        style={{ backgroundImage: `url('/images/home-assests/${bg}.svg')` }}
        aria-label={`${bg} Points`}
      />
    ))}
  </div>
</div>

</div>




  );
}
