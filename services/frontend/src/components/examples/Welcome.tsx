import { useCallback } from "../../hooks/useCallback";
import { ComponentFunction } from "../../types/global";
import { h } from "../../vdom/createElement";

export const Welcome: ComponentFunction = () => {
  const handleGoogleLogin = useCallback(() => {
    window.location.href = '/api/auth/google';
  }, []);

  const handleGithubLogin = useCallback(() => {
    window.location.href = '/api/auth/github';
  }, []);

  const handle42Login = useCallback(() => {
    window.location.href = '/api/auth/intra';
  }, []);

  return (
    <div 
      className='relative w-full min-h-screen overflow-hidden bg-cover bg-center'
      style={{ backgroundImage: 'url(/images/bg-login.png)' }}
    >
      <nav className='flex items-center w-full justify-between px-4 sm:px-6 md:px-12 py-4 h-20'>
        <div className='flex items-center text-white'>
          <img src='/images/logo.png' alt='logo' className='w-10 h-10 md:w-12 md:h-12' />
          <h2 className='text-lg md:text-xl font-[Poppins] italic'>The Game</h2>
        </div>
        
        <div className='hidden md:flex text-[#427970] text-lg md:text-xl font-bold space-x-6 lg:space-x-10'>
          <a href='#' className='hover:text-blue-400 transition'>Home</a>
          <a href='#' className='hover:text-white transition'>Game</a>
          <a href='#' className='hover:text-white transition'>About</a>
        </div>
      </nav>

      {/* Main Content */}
      <section className='w-full min-h-[calc(100vh-5rem)] flex flex-col md:flex-row items-center justify-between px-4 sm:px-6 md:px-12 lg:px-20 py-8'>
        {/* Text Content */}
        <div className='w-full px-12 space-y-8 md:w-1/2 text-center md:text-left mt-8 md:mt-0'>
          <h1 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#427970] leading-tight'>
            ARE YOU READY
          </h1>
          <h2 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight'>
            TO
          </h2>
          <h2 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#427970] leading-tight'>
            PLAY!!
          </h2>
          <p className='text-base sm:text-lg md:text-xl text-gray-100 mt-4 max-w-[500px] mx-auto md:mx-0'>
            Challenge friends or climb the leaderboard in the ultimate ping pong showdown.
          </p>
          
          {/* Buttons */}
          <div className='flex flex-col items-center md:items-start mt-8 space-y-7 px-4 sm:px-12 md:px-24 lg:px-32 xl:px-48'>
            <a 
              href='/login'
              className='w-full max-w-[280px] sm:max-w-[300px] md:w-[200px] lg:w-[220px]'
            >
              <button className='border-2 md:border-4 border-white text-white px-6 sm:px-8 md:px-12 lg:px-16 py-2 md:py-2.5 rounded-full text-base sm:text-lg md:text-xl font-semibold hover:bg-white hover:text-[#0A3E61] transition-all duration-300 w-full max-w-[280px] sm:max-w-[300px] md:w-[200px] lg:w-[220px]'>
                Log In
              </button>
            </a>
            
            {/* Social Icons */}
            <div className='flex gap-8 ml-6'>
              <button 
                className='transform transition-all duration-300 hover:scale-110'
                onClick={handleGoogleLogin}
              >
                <div className='w-8 h-8'>
                  <img src='/images/Google.svg' alt='google-icon' />
                </div>
              </button>
              <button 
                className='transform transition-all duration-300 hover:scale-110'
                onClick={handleGithubLogin}
              >
                <div className='w-8 h-8'>
                  <img src='/images/github.svg' alt='github' />
                </div>
              </button>
              <button 
                className='transform transition-all duration-300 hover:scale-110'
                onClick={handle42Login}
              >
                <div className='w-8 h-8'>
                  <img src='/images/42.svg' alt='42-icon' />
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Player Image */}
        <div className='w-full md:w-1/2 flex justify-center'>
          <div className='rounded-xl w-full max-w-[800px] h-[700px] sm:h-[350px] md:h-[400px]'>
            <img src='/images/player_fix.svg' alt='player.svg' />
          </div>
        </div>
      </section>
    </div>
  );
};

