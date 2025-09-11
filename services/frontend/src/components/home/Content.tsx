import { GameModes } from './GameModes';
import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";


export const Content: ComponentFunction = () => {

  return (
<section className="w-full lg:w-[80%] flex flex-col items-center justify-center relative px-3 sm:px-6 md:px-8 mx-auto">
<div className="w-full text-white text-center space-y-4 sm:space-y-6 md:space-y-7 transform -translate-y-8 sm:-translate-y-12 md:-translate-y-15 lg:-translate-y-9 lg:translate-x-8 xl:translate-x-14">
  <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-8xl font-inconsolata font-bold leading-tight">
    Welcome Back, Player!
  </h1>
  
  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-inria font-medium">
    Ready to gaming?
  </h2>

  <div className="pt-2 sm:pt-4">
    <button
      className="px-8 sm:px-10 md:px-16 py-2 sm:py-3 md:py-4 
                 bg-no-repeat bg-contain bg-center
                 text-white font-bold 
                 transition-transform duration-200 hover:scale-95
                 focus:outline-none "
      style={{ backgroundImage: "url('/images/home-assests/bg-button.svg')" }}
    >
      <span className="font-irish text-white text-lg sm:text-xl md:text-2xl lg:text-4xl tracking-wide">
        Start
      </span>
    </button>
  </div>
</div>

  <GameModes />
</section>
  )
}
