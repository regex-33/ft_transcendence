export function renderWeclome(container: HTMLElement) {
 container.innerHTML = `
<div class="relative w-full min-h-screen overflow-hidden bg-cover bg-center" style="background-image: url('/assets/bg-login.png');">

  <nav class="flex items-center w-full justify-between px-4 sm:px-6 md:px-12 py-4 h-20">
    <div class="flex items-center text-white">
      <img src="/assets/logo.png" alt="logo" class="w-10 h-10 md:w-12 md:h-12">
      <h2 class="text-lg md:text-xl font-[Poppins] italic ml-2">The Game</h2>
    </div>
    
  
    <div class="hidden md:flex text-[#055D65] text-lg md:text-xl font-bold space-x-6 lg:space-x-10">
      <a href="#" class=" hover:text-blue-400 transition">Home</a>
      <a href="#" class=" hover:text-white transition">Game</a>
      <a href="#" class=" hover:text-white transition">About</a>
    </div>
    
    <button class="md:hidden text-white">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  </nav>

  <section class="w-full min-h-[calc(100vh-5rem)] flex flex-col md:flex-row items-center justify-between px-4 sm:px-6 md:px-12 lg:px-20 py-8">
    <div class="w-full md:w-1/2 text-center md:text-left mt-8 md:mt-0">
      <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#055D65] leading-tight">
        ARE YOU READY
      </h1>
      <h2 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
        TO
      </h2>
      <h2 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#055D65] leading-tight">
        PLAY!!
      </h2>
      <p class="text-base sm:text-lg md:text-xl text-gray-100 mt-4 max-w-[500px] mx-auto md:mx-0">
        Challenge friends or climb the leaderboard in the ultimate ping pong showdown.
      </p>
      
      <div class="flex flex-col items-center md:items-start mt-8 space-y-6">
        <button class="border-2 md:border-4 border-white text-white px-12 py-2 md:px-20 md:py-1 rounded-full text-lg md:text-xl font-semibold hover:bg-white hover:text-[#0A3E61] transition-all duration-300">
          Log In
        </button>
        
        <div class="flex gap-9 ml-5">
          <button class="transition-transform hover:scale-110">
            <div class="bg-white rounded-md w-8 h-8" alt="Google">
            <img src="assets/google-icon.svg" alt="google-icon">
            </div>
          </button>
          <button class="transition-transform hover:scale-110">
            <div class="bg-[#5765EC]  rounded-md w-[35px] h-[33px] " alt="Discord">
              <img src="assets/discord-icon.svg" alt="discord">
            </div>
          </button>
          <button class="transition-transform hover:scale-110 -mt-[2px]">
            <div class="bg-white  rounded-md w-[33px] h-[33px]" alt="42">
            <img src="assets/42-icon.svg" alt="42-icon">
            </div>
          </button>
        </div>
      </div>
    </div>
    <div class="w-full md:w-1/2 flex justify-center">
      <div class=" rounded-xl w-full max-w-[800px] h-[700px] sm:h-[350px] md:h-[400px]" alt="Ping Pong Players">
      <img src="assets/player_fix.svg" alt="player.svg">
      </div>
    </div>
  </section>
</div>
`;
}

// <div class="space-y-6 max-w-xl">
// <button class="mt-[80px] ml-[170px] border-[4px] border-white text-white px-12 py-[4px] rounded-full text-xl font-semibold hover:bg-white hover:text-[#0A3E61] transition-all duration-300">
//   Log In
// </button>