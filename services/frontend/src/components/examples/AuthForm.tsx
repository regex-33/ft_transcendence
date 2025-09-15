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

  const [show2FA, setShow2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle2FAInputChange = useCallback((index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`auth-code-${index + 1}`) as HTMLInputElement | null;
      if (nextInput) nextInput.focus();
    }
  }, [verificationCode]);

  const handle2FAKeyDown = useCallback((index: number, e: KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`auth-code-${index - 1}`) as HTMLInputElement | null;
      if (prevInput) prevInput.focus();
    }
  }, [verificationCode]);

  const handle2FAVerify = useCallback(async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Please enter a complete 6-digit code');
      return;
    }

    setTwoFALoading(true);
    setError('');

    try {
      const response = await fetch(
        `http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/2fa/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            username: formData.username,
            token: code
          })
        }
      );

      if (!response.ok) {
        setError('Invalid verification code. Please try again.');
      } else {
        // 2FA verification successful - redirect to home
        window.location.href = '/home';
      }
    } catch (err) {
      console.error('2FA verification error:', err);
      setError('An error occurred during verification');
    } finally {
      setTwoFALoading(false);
    }
  }, [verificationCode, formData.username]);

  const backToLogin = useCallback(() => {
    setShow2FA(false);
    setVerificationCode(['', '', '', '', '', '']);
    setError('');
    setTwoFALoading(false);
  }, []);

  // Render 2FA verification form add by rrregex
  if (show2FA) {
    return (
      <div 
        className='relative min-h-screen bg-cover bg-center'
        style={{ backgroundImage: 'url(/images/bg-login.png)' }}
      >
        <div className='absolute left-6 flex md:top-6 items-center text-white gap-0'>
          <img src='/images/logo.png' alt='logo' className='w-10 h-10' />
          <h2 className='text-xl italic font-semibold'>The Game</h2>
        </div>

        <div className='flex justify-center items-center min-h-screen'>
          <div className='bg-white rounded-2xl shadow-lg p-8 w-full max-w-md'>
            <div className='text-center mb-8'>
              <h2 className='text-2xl font-semibold text-gray-800 mb-2'>Two-Factor Authentication</h2>
              <p className='text-gray-600'>Enter the 6-digit code from your authenticator app</p>
            </div>

            {error && (
              <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
                {error}
              </div>
            )}

            <div className='flex justify-center gap-2 mb-6'>
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`auth-code-${index}`}
                  type='text'
                  inputMode='numeric'
                  value={digit}
                  onInput={(e: Event) => handle2FAInputChange(index, (e.target as HTMLInputElement).value)}
                  onKeyDown={(e: KeyboardEvent) => handle2FAKeyDown(index, e)}
                  className='w-12 h-12 border-2 border-gray-300 rounded-lg text-center text-lg font-medium focus:border-[#3F99B4] focus:outline-none transition-colors '
                  maxLength={1}
                />
              ))}
            </div>

            <div className='space-y-3'>
              <button
                onClick={handle2FAVerify}
                className='w-full bg-[#67A7B9] hover:bg-[#044850] text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {twoFALoading ? 'Verifying...' : 'Verify'}
              </button>

              <button
                onClick={backToLogin}
                className='w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const showLogin = useCallback(() => setIsLoginMode(true), []);
  const showRegister = useCallback(() => setIsLoginMode(false), []);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: Event) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Username validation: 3-20 chars, alphanumeric/underscore
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      setError('Username must be 3-20 characters and contain only letters, numbers, or underscores.');
      setLoading(false);
      return;
    }

    // Password validation: min 8 chars, at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must be at least 8 characters and contain at least one letter and one number.');
      setLoading(false);
      return;
    }

    // Email validation (only for register)
    if (!isLoginMode) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address.');
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords don't match!");
        setLoading(false);
        return;
      }
    }

    try {
      const apiUrl = isLoginMode 
        ? 'api/users/login'
        : 'api/users/register';

      const requestBody = isLoginMode
        ? { username: formData.username, password: formData.password }
        : { username: formData.username, password: formData.password, email: formData.email };
          
      const response = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/${apiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        if (!isLoginMode) {
          window.location.href = data.redirectUrl || '/home';
        } 
        else if (data.require2FA === true) {
          setShow2FA(true);
          setError('');
        } else {
          window.location.href = '/home';
        }
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError('An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  }, [formData, isLoginMode]);

  // namoussa login/register form
  return (
    <div 
      className='relative min-h-screen bg-cover bg-center'
      style={{ backgroundImage: 'url(/images/bg-login.png)' }}
    >
      {/* Logo */}
      <div className='absolute left-6 flex md:top-6 items-center text-white gap-0'>
        <img src='/images/logo.png' alt='logo' className='w-10 h-10' />
        <h2 className='text-xl italic font-semibold'>The Game</h2>
      </div>

      {/* Main Content */}
      <div className='flex flex-col md:flex-row-reverse w-full h-[calc(100vh-5rem)]'>
        {/* Form Container */}
        <div className='flex justify-center items-center w-full md:w-1/2'>
          <div className='bg-white rounded-2xl shadow-lg p-8 mt-[80px] md:p-12 min-h-[400px] w-full max-w-[700px] mr-[20px] flex flex-col justify-center h-full transition-all duration-500'>
            <div className='flex justify-center gap-4 mb-8'>
              <button className={`text-2xl font-semibold ${isLoginMode ? 'text-[#3F99B4]' : 'text-gray-300'}`}>
                Sign In
              </button>
              <span className='text-2xl text-gray-300'>/</span>
              <button className={`text-2xl font-semibold ${!isLoginMode ? 'text-[#3F99B4]' : 'text-gray-300'}`}>
                Sign Up
              </button>
            </div>

            {error && (
              <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
                {error}
              </div>
            )}
          
            <img
              src='/images/mrbean-open.webp'
              alt='Mr Bean'
              className='relative top-[39px] left-[200px] w-48 transform transition-transform duration-300 hover:scale-105 hidden sm:hidden lg:block z-[5]'
            />

            <form onSubmit={handleSubmit} className='relative z-[10]'>
              {!isLoginMode && (
                <input
                  type='email'
                  placeholder='Email'
                  className='w-full mb-3 bg-[#F2F0F0] px-4 py-3 rounded-3xl border outline-none focus:border-[#3F99B4]'
                  value={formData.email}
                  onInput={(e: Event) => handleInputChange('email', (e.target as HTMLInputElement).value)}
                  required={!isLoginMode}
                />
              )}

              <input
                type='text'
                placeholder='Username'
                className='w-full mb-3 px-4 bg-[#F2F0F0] py-3 rounded-3xl border outline-none focus:border-[#3F99B4]'
                value={formData.username}
                onInput={(e: Event) => handleInputChange('username', (e.target as HTMLInputElement).value)}
                required
              />

              <input
                type='password'
                placeholder='Password'
                className='w-full mb-3 px-4 py-3 bg-[#F2F0F0] rounded-3xl border outline-none focus:border-[#3F99B4]'
                value={formData.password}
                onInput={(e: Event) => handleInputChange('password', (e.target as HTMLInputElement).value)}
                required
              />

              {!isLoginMode && (
                <input
                  type='password'
                  placeholder='Confirm Password'
                  className='w-full mb-6 px-4 py-3 bg-[#F2F0F0] rounded-3xl border outline-none focus:border-[#3F99B4]'
                  value={formData.confirmPassword}
                  onInput={(e: Event) => handleInputChange('confirmPassword', (e.target as HTMLInputElement).value)}
                  required={!isLoginMode}
                />
              )}

              <button 
                type='submit'
                className='w-full bg-[#67A7B9] hover:bg-[#044850] text-white py-3 rounded-3xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed mb-10'
              >
                {loading ? (isLoginMode ? 'Signing In...' : 'Signing Up...') : (isLoginMode ? 'Sign In' : 'Sign Up')}
              </button>
            </form>
            
            {/* Toggle */}
            <div className='relative w-full max-w-[300px] mb-6 mx-auto'>
              <div className='flex gap-6 w-full relative'>
                <button
                  onClick={showLogin}
                  className={`flex-1 py-2 rounded-full font-semibold transition-all duration-300 relative z-10 disabled:cursor-not-allowed ${isLoginMode ? 'text-white bg-[#67A7B9]' : 'text-[#858585] bg-[#F2F0F0]'}`}
                >
                  <span className='relative z-20'>Login</span>
                </button>
                <button
                  onClick={showRegister}
                  className={`flex-1 py-2 rounded-full font-semibold transition-all duration-300 relative z-10 disabled:cursor-not-allowed ${!isLoginMode ? 'text-white bg-[#67A7B9]' : 'text-[#858585] bg-[#F2F0F0]'}`}
                >
                  <span className='relative z-20'>Register</span>
                </button>
                <div
                  className='absolute bottom-0 h-full w-[calc(50%-8px)] bg-[#67A7B9] rounded-full transition-all duration-500'
                  style={{
                    left: isLoginMode ? '8px' : 'calc(50% + 8px)',
                    transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className='w-full md:w-1/2 flex items-center justify-center'>
          <img 
            src='/images/player_fix.svg' 
            alt='player' 
            className='w-full h-full object-contain p-6 md:p-12' 
          />
        </div>
      </div>
    </div>
  );
};

