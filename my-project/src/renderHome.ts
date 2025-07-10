export function renderHome(container: HTMLElement) {
 container.innerHTML = `
<div class="relative w-full min-h-screen overflow-hidden bg-cover bg-center" style="background-image: url('/assets/bg-login.png');">
  <nav class="flex items-center  w-full justify-start px-12 py-4 h-20">
    <div class="flex items-center text-white">
      <img src="assets/logo.png" alt="logo" class="w-12 h-12">
      <h2 class="text-xl font-[Poppins] italic">The Game</h2>
    </div>

    <div class="text-emerald-700  text-xl font-bold space-x-10 pl-20">
    <a href="#" class="text-white hover:text-blue-400">Home</a>
    <a href="#" class=" hover:text-white">Game</a>
    <a href="#" class="hover:text-white">About</a>
    </div>
  </nav>
<section class="w-full h-[calc(100vh-5rem)] flex items-center justify-start pr-20">
  
<section class="relative w-full h-screen">
  <div class="absolute top-40 left-1/4 space-y-1 text-left">

    <h1 class="text-[79px] tracking-tight font-extrabold text-[#055D65] leading-tight">
      ARE YOU READY
    </h1>

    <h2 class="text-[80px] font-extrabold text-white leading-tight">
      TO
    </h2>

    <h2 class="text-[80px] tracking-tight font-extrabold text-[#055D65] leading-tight">
      PLAYE!!
    </h2>

    <p class="text-lg text-white mt-4 max-w-[500px]">
      Challenge friends or climb the leaderboard in the ultimate ping pong showdown.
    </p>
  <div class="space-y-6 max-w-xl">
  <button class="mt-[80px] ml-[170px] border-[4px] border-white text-white px-12 py-[4px] rounded-full text-xl font-semibold hover:bg-white hover:text-[#0A3E61] transition-all duration-300">
    Log In
  </button>
  </div>



  </div>
</section>

    <div class="w-[1000px]">
        <img src="assets/player_fix.svg" alt="players" class="w-full h-auto">
    </div>
  
</section>

</div>


`;
}

