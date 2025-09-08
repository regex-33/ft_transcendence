import { GameModes } from './GameModes';
import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";


export const Content: ComponentFunction = () => {

  return (
<section className="w-full lg:w-[80%] flex flex-col items-center justify-center relative px-3 sm:px-6 md:px-8 mx-auto">
  <div className="w-full text-white text-center space-y-7 -translate-y-15 lg:-translate-y-9 lg:translate-x-14">
    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-inconsolata fon-bold">
      Welcome Back, Player!
    </h1>
    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-inria font-medium">
      Ready to gaming?
    </h2>

    <button
      className="px-10 sm:px-16 py-3 sm:py-4 bg-no-repeat bg-contain bg-center
       text-white font-bold text-lg 
      transition-transform duration-200 hover:scale-95"
      style={{ backgroundImage: "url('/images/home-assests/bg-button.svg')" }}
    >
      <span className="font-irish text-white text-xl sm:text-4xl tracking-wide">
        Start
      </span>
    </button>
  </div>

  <GameModes />
</section>
  )
}
