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
    password: '',
    confirmPassword: ''
  });

  const showLogin = useCallback(() => setIsLoginMode(true), []);
  const showRegister = useCallback(() => setIsLoginMode(false), []);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  ///////////////////////////////
 const handleSubmit = useCallback(async (e: Event) => {
  e.preventDefault();
  
  // Validate confirm password in register mode
  if (!isLoginMode && formData.password !== formData.confirmPassword) {
    alert("Passwords don't match!");
    return;
  }

  try {
    const apiUrl = isLoginMode 
      ? '/api/users/login'
      : '/api/users/register';

    const requestBody = isLoginMode
      ? {
          username: formData.username,
          password: formData.password
        }
      : {
          username: formData.username,
          password: formData.password,
          email: formData.email,
        };

    const response = await fetch(apiUrl, 
      {
      method: 'POST',
      headers: 
      {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) 
    {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Authentication failed');
    }

    const data = await response.json();
    const token = data.token;

    // Store token
    localStorage.setItem('authToken', token);

    console.log('successful:', data);
    // Redirect
    
  } 
  catch (error) 
  {
    console.error('Authentication error:', error);
    
  
    if (error instanceof Error) 
    {
      alert(error.message || 'An error occurred during authentication');
    }
    else 
    {
      alert('An unknown error occurred');
    }
  }
}, [formData, isLoginMode]);
////////////////////////////////////////
  return h('div', { 
    className: 'relative min-h-screen bg-cover bg-center',
    style: { backgroundImage: 'url(/images/bg-login.png)' }
  },
    // Logo
    h('div', { className: 'absolute  left-6 flex md:top-6   items-center text-white gap-0' },
      h('img', { src: '/images/logo.png', alt: 'logo', className: 'w-10 h-10' }),
      h('h2', { className: 'text-xl italic font-semibold' }, 'The Game')
    ),

    // Main Content
    h('div', { className: 'flex flex-col md:flex-row-reverse w-full h-[calc(100vh-5rem)]' },
      // Form Container
      h('div', { className: 'flex justify-center items-center w-full md:w-1/2' },
        h('div', { 
          className: 'bg-white rounded-2xl shadow-lg p-8 mt-[80px] md:p-12 min-h-[400px] w-full max-w-[700px] mr-[20px] flex flex-col justify-center h-full transition-all duration-500'
        },
          h('div', { className: 'flex justify-center gap-4 mb-8' },
            h('button', { 
              className: `text-2xl font-semibold ${isLoginMode ? 'text-[#3F99B4]' : 'text-gray-300'}`,
            }, 'Sign In'),
            h('span', { className: 'text-2xl text-gray-300' }, '/'),
            h('button', { 
              className: `text-2xl font-semibold ${!isLoginMode ? 'text-[#3F99B4]' : 'text-gray-300'}`,
            }, 'Sign Up')
          ),
        
          h('img', {
          src: '/images/mrbean-open.webp',
          alt: 'Mr Bean',
          className: 'relative top-[40px]  left-[130px] w-48 transform transition-transform duration-300 hover:scale-105'
        }),
          // Form Fields
          h('form', { onSubmit: handleSubmit},
            !isLoginMode && h('input', {
              type: 'email',
              placeholder: 'Email',
              className: 'w-full mb-3 bg-[#F2F0F0]  px-4 py-3  rounded-3xl',
              value: formData.email,
              onInput: (e:Event) => handleInputChange('email', (e.target as HTMLInputElement).value),
              required: !isLoginMode
            }),

            h('input', {
              type: 'text',
              placeholder: 'Username',
              className: 'w-full mb-3 px-4 bg-[#F2F0F0]  py-3  rounded-3xl',
              value: formData.username,
              onInput: (e: Event) => handleInputChange('username', (e.target as HTMLInputElement).value),
              required: true
            }),

            h('input', {
              type: 'password',
              placeholder: 'Password',
              className: 'w-full mb-3 px-4 py-3  bg-[#F2F0F0]  rounded-3xl',
              value: formData.password,
              onInput: (e:Event) => handleInputChange('password', (e.target as HTMLInputElement).value),
              required: true
            }),

            !isLoginMode && h('input', {
              type: 'password',
              placeholder: 'Confirm Password',
              className: 'w-full mb-6 px-4 py-3 bg-[#F2F0F0]   rounded-3xl',
              value: formData.confirmPassword,
              onInput: (e:Event) => handleInputChange('confirmPassword', (e.target as HTMLInputElement).value),
              required: !isLoginMode
            }),

            // Submit Button
            h('button', { 
              type: 'submit',
              className: 'w-full bg-[#67A7B9] hover:bg-[#044850] text-white py-3 rounded-3xl font-semibold transition mb-10'
            }, isLoginMode ? 'Sign In' : 'Sign Up')
          ),
          
          // Toggle 
        h('div', { className: 'relative w-full max-w-[300px] mb-6 mx-auto' },
          h('div', { className: 'flex gap-6 w-full relative ' },
            h('button', {
              onClick: showLogin,
              className: `flex-1 py-2 rounded-full font-semibold transition-all duration-300 relative z-10 ${isLoginMode ? 'text-white bg-[#67A7B9]' : 'text-[#858585] bg-[#F2F0F0]'}`
            },
              h('span', { className: 'relative z-20' }, 'Login')
            ),
            h('button', {
              onClick: showRegister,
              className: `flex-1 py-2 rounded-full font-semibold transition-all duration-300 relative z-10 ${!isLoginMode ? 'text-white bg-[#67A7B9]' : 'text-[#858585] bg-[#F2F0F0]'}`
            },
              h('span', { className: 'relative z-20' }, 'Register')
            ),
            h('div', {
              className: 'absolute bottom-0 h-full w-[calc(50%-8px)] bg-[#67A7B9] rounded-full transition-all duration-500',
              style: {
                left: isLoginMode ? '8px' : 'calc(50% + 8px)',
                transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)'
              }
            })
          )
        )
        )
      ),

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
