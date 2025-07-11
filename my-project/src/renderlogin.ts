export function renderlogin(container: HTMLElement) {
 container.innerHTML = `
<div class="relative min-h-screen bg-cover bg-center" style="background-image: url('/assets/bg-login.png');">
  <div class="absolute top-6 right-6 flex items-center text-white gap-3">
    <img src="/assets/logo.png" alt="logo" class="w-10 h-10">
    <h2 class="text-xl italic font-semibold">The Game</h2>
  </div>
  <div class="flex flex-col md:flex-row w-full h-[calc(100vh-5rem)]">

    <div class="flex justify-center items-center w-full md:w-1/2">
      <div class="bg-gray-100 rounded-2xl shadow-lg p-8 mt-[80px] md:p-12 min-h-[600px] w-full max-w-[800px] ml-[20px] flex flex-col justify-center h-full">
        
  
        <h2 class="text-4xl font-semibold text-gray-300 mb-[100px] text-center">
            <span class=" text-gray-300">Signup/</span>
            <span class=" text-[#3F99B4] transition-transform duration-300 hover:scale-105 inline-block">
                Login
            </span>
        </h2>

    <div class="flex justify-center mb-0">
    <img src="/assets/mrbean.svg" alt="Mr. Bean"
        class="w-[200px] h-[200px] rounded-full object-cover" />
    </div>
    <input type="text" placeholder="Username"
    class="w-full bg-gray-100 mt-[-65px] mb-3 px-4 py-3 border border-gray-300 rounded-3xl relative z-10" />

    <input type="password" placeholder="Password" 
       class="w-full bg-gray-100 mb-2 px-4 py-3 border border-gray-300 rounded-3xl" />
        <button class="w-full bg-[#3F99B4] hover:bg-[#044850] text-white py-3 rounded-3xl font-semibold transition">
          Login
        </button>

        <p class="text-sm text-gray-600 mt-6 text-center">
          Don’t have an account?
          <button onclick="renderSignup(document.getElementById('root'))" class="text-[#055D65] font-semibold underline">Signup</button>
        </p>
      </div>
    </div>

    <div class="w-full md:w-1/2 flex items-center justify-center">
      <img src="/assets/player_fix.svg" alt="player" class="w-full h-full object-contain p-6 md:p-12">
    </div>
  </div>
  
</div>










 `;
}

// <div class="relative w-full max-w-md mx-auto" id="auth-wrapper">
//   <!-- Login Form -->
  
//   <div id="login-form" class="transition-all duration-500">
//     <h2 class="text-2xl font-bold text-center text-white mb-4">Login</h2>
//     <input type="text" placeholder="Username" class="w-full mb-4 px-4 py-2 rounded" />
//     <input type="password" placeholder="Password" class="w-full mb-4 px-4 py-2 rounded" />
//     <button class="w-full bg-emerald-600 text-white py-2 rounded">Log In</button>
//     <p class="text-center text-white mt-4">
//       Don’t have an account?
//       <button onclick="showRegister()" class="text-emerald-400 underline">Register</button>
//     </p>
//   </div>

//   <!-- Register Form -->
//   <div id="register-form" class="hidden transition-all duration-500">
//     <h2 class="text-2xl font-bold text-center text-white mb-4">Register</h2>
//     <input type="text" placeholder="Username" class="w-full mb-4 px-4 py-2 rounded" />
//     <input type="email" placeholder="Email" class="w-full mb-4 px-4 py-2 rounded" />
//     <input type="password" placeholder="Password" class="w-full mb-4 px-4 py-2 rounded" />
//     <button class="w-full bg-emerald-600 text-white py-2 rounded">Register</button>
//     <p class="text-center text-white mt-4">
//       Already have an account?
//       <button onclick="showLogin()" class="text-emerald-400 underline">Login</button>
//     </p>
//   </div>
// </div>