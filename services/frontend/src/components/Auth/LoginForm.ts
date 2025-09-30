import { useCallback } from "../../hooks/useCallback";
import { useEffect } from "../../hooks/useEffect";
import { useState } from "../../hooks/useState";
import { ComponentFunction } from "../../types/global";
import { h } from "../../vdom/createElement";


export const PongLoginPage: ComponentFunction = () => {
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  // Form toggle handlers
  const showLogin = useCallback(() => setIsLoginForm(true), []);
  const showRegister = useCallback(() => setIsLoginForm(false), []);

  // Input change handler

  // const handleInputChange = useCallback((field: string, value: string) => {
  //   //console.log('Input changing:', field, value); // Add this debug line
  //   setFormData(prev => ({ ...prev, [field]: value }));
  // }, []);
  // Form submission handlers
  const handleLoginSubmit = useCallback((e: Event) => {
    e.preventDefault();
    //console.log('Login attempt:', { email: formData.email, password: formData.password });
    // Add your login logic here
  }, [formData]);

  const handleRegisterSubmit = useCallback((e: Event) => {
    e.preventDefault();
    //console.log('Register attempt:', formData);
    // Add your registration logic here
  }, [formData]);

  // Social login handlers
  const handleGoogleLogin = useCallback(() => {
    //console.log('Google login');
    // Add Google OAuth logic
  }, []);

  const handleDiscordLogin = useCallback(() => {
    //console.log('Discord login');
    // Add Discord OAuth logic
  }, []);

  const handle42Login = useCallback(() => {
    //console.log('42 login');
    // Add 42 OAuth logic
  }, []);

  return h('div', { 
    className: 'min-h-screen flex flex-col md:flex-row overflow-hidden bg-[#1B191D] text-white font-[\'Roboto\']',
    style: {
      fontFamily: 'Roboto, sans-serif'
    }
  },
    // Left Side: Login/Register Form
    h('div', { 
      className: 'z-20 w-full md:w-2/5 flex flex-col justify-center items-center pb-[260px] px-8 py-12 min-h-screen md:min-h-0' 
    },
      h('div', { className: 'flex flex-col items-center space-y-8 w-full max-w-md' },
        
        // Game Logo
        h('img', {
          src: '/images/PingPongName.svg',
          alt: 'GameName',
          className: 'w-48 mb-4 md:mb-12 transform transition-transform duration-300 hover:scale-105'
        }),

        // Main Title
        h('h1', {
          className: 'text-3xl md:text-4xl font-bold text-center transform transition-all duration-300 hover:scale-[1.02]'
        }, 'Are you ready to play!'),

        // Mr Bean Image
        h('img', {
          src: '/src/pages/html/mrbean-open.webp',
          alt: 'Mr Bean',
          className: 'relative top-[68px] w-48 transform transition-transform duration-300 hover:scale-105'
        }),

        // Forms Container
        h('div', { 
          className: 'w-full relative h-64',
          style: { perspective: '1000px' }
        },
          // Login Form
          h('form', {
            className: `absolute w-full space-y-4 origin-center transition-all duration-600 ${isLoginForm ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`,
            style: {
              transform: isLoginForm ? 'translateX(0) rotateY(0)' : 'translateX(-100%) rotateY(90deg)',
              zIndex: isLoginForm ? 10 : 1
            },
            onSubmit: handleLoginSubmit
          },
            h('div', { className: 'flex flex-col space-y-2' },
              h('input', {
                key: `${isLoginForm ? 'login' : 'register'}-email`,
                type: 'text',
                placeholder: 'Email or Username',
                className: 'w-full p-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c04623] transform transition-all duration-300 hover:scale-[1.02]',
                value: formData.email,
                // onInput: (e: Event) => handleInputChange('email', (e.target as HTMLInputElement).value),
                tabIndex: isLoginForm ? 0 : -1
              }),
              h('input', {
                key: `${isLoginForm ? 'login' : 'register'}-email`,
                type: 'password',
                placeholder: 'Password',
                className: 'w-full p-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c04623] transform transition-all duration-300 hover:scale-[1.02]',
                value: formData.password,
                // onInput: (e: Event) => handleInputChange('password', (e.target as HTMLInputElement).value),
                tabIndex: isLoginForm ? 0 : -1
              }),
              h('button', {
                type: 'submit',
                className: 'w-full py-3 bg-[#c04623] rounded-lg font-semibold hover:opacity-90 transition-opacity transform hover:scale-[1.02] duration-300',
                tabIndex: isLoginForm ? 0 : -1
              }, 'Sign In')
              // h('spann d', { className: 'text-center text-gray-400 mt-2' }, 'or')
            )
          ),

          // Register Form
          h('form', {
            className: `absolute w-full space-y-4 origin-center transition-all duration-600 ${!isLoginForm ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`,
            style: {
              transform: !isLoginForm ? 'translateX(0) rotateY(0)' : 'translateX(100%) rotateY(-90deg)',
              zIndex: !isLoginForm ? 10 : 1
            },
            onSubmit: handleRegisterSubmit
          },
            h('div', { className: 'flex flex-col space-y-2' },
              h('input', {
                type: 'email',
                placeholder: 'Email',
                className: 'w-full p-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c04623] transform transition-all duration-300 hover:scale-[1.02]',
                value: formData.email,
                // onInput: (e: Event) => handleInputChange('email', (e.target as HTMLInputElement).value),
                tabIndex: !isLoginForm ? 0 : -1
              }),
              h('input', {
                type: 'text',
                placeholder: 'Username',
                className: 'w-full p-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c04623] transform transition-all duration-300 hover:scale-[1.02]',
                value: formData.username,
                // onInput: (e: Event) => handleInputChange('username', (e.target as HTMLInputElement).value),
                tabIndex: !isLoginForm ? 0 : -1
              }),
              h('input', {
                type: 'password',
                placeholder: 'Password',
                className: 'w-full p-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c04623] transform transition-all duration-300 hover:scale-[1.02]',
                value: formData.password,
                // onInput: (e: Event) => handleInputChange('password', (e.target as HTMLInputElement).value),
                tabIndex: !isLoginForm ? 0 : -1
              }),
              h('input', {
                type: 'password',
                placeholder: 'Confirm Password',
                className: 'w-full p-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c04623] transform transition-all duration-300 hover:scale-[1.02]',
                value: formData.confirmPassword,
                // onInput: (e: Event) => handleInputChange('confirmPassword', (e.target as HTMLInputElement).value),
                tabIndex: !isLoginForm ? 0 : -1
              }),
              h('button', {
                type: 'submit',
                className: 'w-full py-3 bg-[#c04623] rounded-lg font-semibold hover:opacity-90 transition-opacity transform hover:scale-[1.02] duration-300',
                tabIndex: !isLoginForm ? 0 : -1
              }, 'Create Account')
            )
          )
        ),

        // Toggle Buttons
        h('div', { className: 'relative w-full max-w-[300px] mb-6' },
          h('div', { className: 'flex gap-4 w-full relative' },
            h('button', {
              onClick: showLogin,
              className: `flex-1 py-2 rounded-lg font-semibold transition-all duration-300 relative z-10 ${isLoginForm ? 'text-white' : 'text-gray-400'}`
            },
              h('span', { className: 'relative z-20' }, 'Login')
            ),
            h('button', {
              onClick: showRegister,
              className: `flex-1 py-2 rounded-lg font-semibold transition-all duration-300 relative z-10 ${!isLoginForm ? 'text-white' : 'text-gray-400'}`
            },
              h('span', { className: 'relative z-20' }, 'Register')
            ),
            h('div', {
              className: 'absolute bottom-0 h-full bg-[#c04623] rounded-lg transition-all duration-500',
              style: {
                width: '50%',
                left: isLoginForm ? '0%' : '50%',
                transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)'
              }
            })
          )
        ),

        // Social Login Buttons
        h('div', { className: 'flex justify-center space-x-7 mt-8' },
          h('a', {
            href: '#',
            onClick: handleGoogleLogin,
            className: 'transform transition-all duration-300 hover:scale-110'
          },
            h('img', {
              src: '/images/Google.svg',
              alt: 'Google',
              className: 'w-12 h-12'
            })
          ),
          h('a', {
            href: '#',
            onClick: handleDiscordLogin,
            className: 'transform transition-all duration-300 hover:scale-110'
          },
            h('img', {
              src: '/images/Discord.svg',
              alt: 'Discord',
              className: 'w-12 h-12'
            })
          ),
          h('a', {
            href: '#',
            onClick: handle42Login,
            className: 'transform transition-all duration-300 hover:scale-110'
          },
            h('img', {
              src: '/images/42.svg',
              alt: '42',
              className: 'w-12 h-12'
            })
          )
        )
      )
    ),

    // Right Side: Background Image
    h('div', { className: 'hidden md:block absolute right-0 top-0 h-full w-full overflow-hidden' },
      h('img', {
        src: '/images/Background.svg',
        alt: 'background',
        className: 'h-full w-full object-cover transform transition-all duration-1000 hover:scale-105'
      })
    )
  );
};

// CSS animations that need to be added to your global styles
export const pongLoginStyles = `
@keyframes slideIn {
  0% {
    transform: translateX(100%) rotateY(-90deg);
    opacity: 0;
  }
  100% {
    transform: translateX(0) rotateY(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  0% {
    transform: translateX(0) rotateY(0);
    opacity: 1;
  }
  100% {
    transform: translateX(-100%) rotateY(90deg);
    opacity: 0;
  }
}
`;