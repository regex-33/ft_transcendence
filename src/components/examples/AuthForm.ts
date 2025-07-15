import { useCallback } from "../../hooks/useCallback";
import { useEffect } from "../../hooks/useEffect";
import { useState } from "../../hooks/useState";
import { ComponentFunction } from "../../types/global";
import { h } from "../../vdom/createElement";

export const AuthForm: ComponentFunction = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const showLogin = useCallback(() => setIsLoginMode(true), []);
  const showRegister = useCallback(() => setIsLoginMode(false), []);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback((e: Event) => {
    e.preventDefault();
    console.log(isLoginMode ? 'Logging in' : 'Registering', formData);
    // Add your API calls here
  }, [formData, isLoginMode]);

  return h('div', { 
    className: 'relative min-h-screen bg-cover bg-center',
    style: { backgroundImage: 'url(/images/bg-login.png)' }
  },
    // Logo
    h('div', { className: 'absolute top-6 left-6 flex items-center text-white gap-3' },
      h('img', { src: '/images/logo.png', alt: 'logo', className: 'w-10 h-10' }),
      h('h2', { className: 'text-xl italic font-semibold' }, 'The Game')
    ),

    // Main Content
    h('div', { className: 'flex flex-col md:flex-row-reverse w-full h-[calc(100vh-5rem)]' },
      // Form Container
      h('div', { className: 'flex justify-center items-center w-full md:w-1/2' },
        h('div', { 
          className: 'bg-white rounded-2xl shadow-lg p-8 mt-[80px] md:p-12 min-h-[600px] w-full max-w-[800px] mr-[20px] flex flex-col justify-center h-full transition-all duration-500'
        },
          // Title
          h('h2', { className: 'text-4xl font-semibold text-gray-300 mb-[100px] text-center' },
            h('span', { 
              className: 'text-gray-300 cursor-pointer',
              // onClick: showRegister
            }, 'Login/'),
            h('span', { 
              className: 'text-[#3F99B4] transition-transform duration-300 hover:scale-105 inline-block cursor-pointer',
              onClick: showLogin
            }, 'Signup')
          ),

          // Mr. Bean Image
          // h('div', { className: 'flex justify-center mb-0' },
          //   h('img', { 
          //     src: '/images/mrbean.svg', 
          //     alt: 'Mr. Bean',
          //     className: 'w-[200px] h-[200px] rounded-full object-cover' 
          //   })
          // ),

          // Form Fields
          h('form', { onSubmit: handleSubmit },
            isLoginMode && h('input', {
              type: 'text',
              placeholder: 'Username',
              className: 'w-full mb-3 px-4 py-3  border border-gray-300 rounded-3xl',
              value: formData.username,
              onInput: (e: Event) => handleInputChange('username', (e.target as HTMLInputElement).value),
              required: true
            }),

            !isLoginMode && h('input', {
              type: 'email',
              placeholder: 'Email',
              className: 'w-full mb-3 px-4 py-3 border border-gray-300 rounded-3xl',
              value: formData.email,
              onInput: (e:Event) => handleInputChange('email', (e.target as HTMLInputElement).value),
              required: !isLoginMode
            }),

            h('input', {
              type: 'password',
              placeholder: 'Password',
              className: 'w-full mb-2 px-4 py-3 border border-gray-300 rounded-3xl',
              value: formData.password,
              onInput: (e:Event) => handleInputChange('password', (e.target as HTMLInputElement).value),
              required: true
            }),

            // Submit Button
            h('button', { 
              type: 'submit',
              className: 'w-full bg-[#3F99B4] hover:bg-[#044850] text-white py-3 rounded-3xl font-semibold transition'
            }, isLoginMode ? 'Login' : 'Signup'),

            // Toggle Link
            h('p', { className: 'text-sm text-gray-600 mt-6 text-center' },
              isLoginMode ? "Don't have an account? " : "Already have an account? ",
              h('button', { 
                className: 'text-[#055D65] font-semibold underline',
                onClick: isLoginMode ? showRegister : showLogin
              }, isLoginMode ? 'Signup' : 'Login')
            )
          )
        )
      ),

      // Player Image
      h('div', { className: 'w-full md:w-1/2 flex items-center justify-center' },
        h('img', { 
          src: '/images/player_fix.svg', 
          alt: 'player', 
          className: 'w-full h-full object-contain p-6 md:p-12' 
        })
      )
    )
  );
};