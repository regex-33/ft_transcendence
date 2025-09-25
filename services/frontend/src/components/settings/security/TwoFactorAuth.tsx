import { useCallback } from "../../../hooks/useCallback";
import { useEffect } from "../../../hooks/useEffect";
import { useState } from "../../../hooks/useState";
import { ComponentFunction } from "../../../types/global";
import { h } from "../../../vdom/createElement";

export const TwoFactorAuth: ComponentFunction = (props) => {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [showSetup, setShowSetup] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Disable 2FA modal state
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);

  useEffect(() => {
    checkTwoFAStatus();
  }, []);
  
  useEffect(() => {
    let timer: number;
    if (error || success) {
      timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [error, success]);

  const checkTwoFAStatus = async () => {
    try {
      setIsCheckingStatus(true);
      
      const twoFAResponse = await fetch(
        `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/2fa/status`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }
      );
      
      if (twoFAResponse.ok) {
        const twoFAData = await twoFAResponse.json();
        
        /**
         * FINAL FIX:
         * The API response for 2FA status is `{"isActive": true}`.
         * This line is updated to check for `twoFAData.isActive` first.
         * The previous checks for `enabled` and `twoFactorEnabled` are kept as fallbacks
         * to make the component more robust against potential API changes.
         */
        const isEnabled = twoFAData.isActive || twoFAData.enabled || twoFAData.twoFactorEnabled || false;
        setTwoFAEnabled(isEnabled);

      } else {
        setTwoFAEnabled(false);
        console.error('Failed to get a valid 2FA status response:', twoFAResponse.statusText);
      }
    } catch (err) {
      console.error('Error checking 2FA status:', err);
      setTwoFAEnabled(false);
      setError('Unable to check 2FA status. Please refresh.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const generateQRCode = async () => {
    if (twoFAEnabled) {
      setError('Two-Factor Authentication is already enabled for your account.');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/2fa/generate`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }
      );

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to generate QR code');
      } else {
        setQrCodeUrl(data.qrCodeUrl);
        setShowSetup(true);
        setError('');
      }
    } catch (err) {
      setError('Network error while generating QR code.');
      console.error('QR generation error:', err);
    }
  };

  const handleInputChange = useCallback((index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }, [verificationCode]);

  const handleKeyDown = useCallback((index: number, e: KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  }, [verificationCode]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const paste = (e.clipboardData?.getData('text') ?? '').trim();
    if (!paste) return;
    
    const digits = paste.split('').slice(0, 6);
    if (digits.length === 0) return;

    const newCode = [...verificationCode];
    for (let i = 0; i < 6; i++) {
      newCode[i] = digits[i] ?? '';
    }
    setVerificationCode(newCode);

    for (let i = 0; i < 6; i++) {
      if (!newCode[i]) {
        const el = document.getElementById(`code-${i}`) as HTMLInputElement;
        if (el) { el.focus(); break; }
      }
      if (i === 5) {
        const el = document.getElementById(`code-5`) as HTMLInputElement;
        if (el) el.focus();
      }
    }

    e.preventDefault();
  }, [verificationCode]);

  const verifyAndEnable2FA = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Please enter a complete 6-digit verification code');
      return;
    }

    setError('');
    setSuccess('');

    let profileData = null;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users/get/me`,
        {
          method: 'GET',
          credentials: 'include'
        }
      );
      if (response.ok) {
        profileData = await response.json();
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (err) {
      setError('Could not verify user data. Please try again.');
      return;
    }

    if (!profileData || !profileData.username) {
      setError('User data is incomplete. Please try again.');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/2fa/active2fa`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            username: profileData.username,
            code,
          }),
        }
      );

      if (!response.ok) {
        setError('Invalid verification code. Please try again.');
        return;
      }

      setSuccess('Two-Factor Authentication has been successfully enabled!');
      setTwoFAEnabled(true);
      setShowSetup(false);
      setVerificationCode(['', '', '', '', '', '']);
      setQrCodeUrl('');
    } catch (err) {
      setError('Network error occurred. Please try again.');
      console.error('2FA verification error:', err);
    }
  };

  const disable2FA = async () => {
    setShowDisable2FAModal(true);
  };

  const handleDisable2FASubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const disableResponse = await fetch(
        `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/2fa/disable`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );
      if (!disableResponse.ok) {
        const disableData = await disableResponse.json();
        setError(disableData.message || 'Failed to disable 2FA');
      } else {
        setSuccess('Two-Factor Authentication has been disabled.');
        setTwoFAEnabled(false);
      }
      setShowDisable2FAModal(false);
    } catch (err) {
      setError('Network error occurred. Please try again.');
      console.error('2FA disable error:', err);
    }
  };

  const resetSetup = () => {
    setShowSetup(false);
    setQrCodeUrl('');
    setVerificationCode(['', '', '', '', '', '']);
    setError('');
    setSuccess('');
  };

  if (isCheckingStatus) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white text-xl">Loading 2FA settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">Two-Factor Authentication</h3>
          <p className="text-gray-200 text-sm">Secure your account with 2FA</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          twoFAEnabled 
            ? 'bg-green-500/20 text-green-100 border border-green-400' 
            : 'bg-gray-500/20 text-gray-200 border border-gray-400'
        }`}>
          {twoFAEnabled ? 'Enabled' : 'Disabled'}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-400 text-red-100 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-400 text-green-100 rounded">
          {success}
        </div>
      )}

      {!showSetup ? (
        <div className="space-y-4">
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-white">
              {twoFAEnabled 
                ? "Two-factor authentication is currently enabled for your account. You'll need to enter a code from your authenticator app when logging in."
                : "Enable two-factor authentication to add an extra layer of security to your account. You'll need an authenticator app like Google Authenticator or Authy."
              }
            </p>
          </div>

          <div className="flex space-x-3">
            {!twoFAEnabled ? (
              <button
                onClick={generateQRCode}
                className="flex items-center justify-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Enable 2FA
              </button>
            ) : (
              <button
                onClick={disable2FA}
                className="flex items-center justify-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Disable 2FA
              </button>
            )}
            
            <button
              onClick={checkTwoFAStatus}
              className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <h4 className="text-lg font-medium text-white mb-2">Set up Two-Factor Authentication</h4>
            <p className="text-gray-200 text-sm mb-4">
              1. Install an authenticator app (Google Authenticator, Authy, etc.)<br/>
              2. Scan this QR code with your authenticator app<br/>
              3. Enter the 6-digit code from your app below
            </p>
            
            {qrCodeUrl ? (
              <div className="flex justify-center mb-4">
                <img
                  src={qrCodeUrl}
                  alt="2FA QR Code"
                  className="w-48 h-48 border rounded-lg shadow-md bg-white p-2"
                />
              </div>
            ) : (
              <div className="flex justify-center mb-4">
                <div className="w-48 h-48 border rounded-lg shadow-md bg-white/20 flex items-center justify-center">
                  <span className="text-gray-200">Loading QR Code...</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-3 text-center">
                Enter the 6-digit code from your authenticator app
              </label>
              <div className="flex justify-center gap-3" onPaste={handlePaste as any}>
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onInput={(e: any) => handleInputChange(index, e.currentTarget.value)}
                    onKeyDown={(e: any) => handleKeyDown(index, e)}
                    maxLength={1}
                    className="w-10 h-10 bg-white/20 text-white border-2 border-white/30 rounded-lg text-center text-xl font-bold shadow-sm focus:ring-2 focus:ring-white/50 focus:border-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                ))}
              </div>
              <p className="text-gray-300 text-xs text-center mt-2">
                The code refreshes every 30 seconds
              </p>
            </div>

            <div className="flex space-x-3 justify-center">
              <button
                onClick={verifyAndEnable2FA}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Verify & Enable
              </button>
              <button
                onClick={resetSetup}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable 2FA Confirmation Modal */}
      {showDisable2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-[#64B0C5] rounded-lg shadow-lg p-6 w-full max-w-sm border border-white/30">
            <h3 className="text-lg font-semibold mb-4 text-white">Confirm Disable 2FA</h3>
            <form onSubmit={handleDisable2FASubmit} className="space-y-4">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setShowDisable2FAModal(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Disable 2FA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};