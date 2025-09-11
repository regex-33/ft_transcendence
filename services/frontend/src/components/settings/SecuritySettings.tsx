import { useState } from "../../hooks/useState";
import { ComponentFunction } from "../../types/global";
import { h } from "../../vdom/createElement";
import { TwoFactorAuth } from "./security/TwoFactorAuth";
import { SessionManagement } from "./security/SessionManagement";
import { PasswordReset } from "./security/PasswordReset";

export const SecuritySettings: ComponentFunction = (props) => {
  const [activeTab, setActiveTab] = useState<'2fa' | 'password' | 'sessions'>('2fa');
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');

  const handleSuccess = (message: string) => {
    setGlobalSuccess(message);
    setGlobalError('');
    // clear success message after 5 seconds
    setTimeout(() => setGlobalSuccess(''), 5000);
  };

  const handleError = (message: string) => {
    setGlobalError(message);
    setGlobalSuccess('');
    setTimeout(() => setGlobalError(''), 5000);
  };

  return (
    <div
      className="h-[700px] max-w-[1400px] bg-[#64B0C5] bg-opacity-85 mr-auto mt-12 rounded-xl p-6 pt-12 overflow-y-auto"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#64B0C5 transparent',
      }}
    >
      <div className="relative w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-white/30 pb-4">
          <h2 className="text-2xl font-irish text-white">Security Settings</h2>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/30 mb-6">
          <button
            className={`py-2 px-4 font-medium text-sm transition-colors ${
              activeTab === '2fa' 
                ? 'text-white border-b-2 border-white' 
                : 'text-gray-200 hover:text-white'
            }`}
            onClick={() => setActiveTab('2fa')}
          >
            Two-Factor Auth
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm transition-colors ${
              activeTab === 'password' 
                ? 'text-white border-b-2 border-white' 
                : 'text-gray-200 hover:text-white'
            }`}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm transition-colors ${
              activeTab === 'sessions' 
                ? 'text-white border-b-2 border-white' 
                : 'text-gray-200 hover:text-white'
            }`}
            onClick={() => setActiveTab('sessions')}
          >
            Active Sessions
          </button>
        </div>
        
        {/* Global Messages */}
        {globalError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-400 text-red-100 rounded">
            {globalError}
          </div>
        )}

        {globalSuccess && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-400 text-green-100 rounded">
            {globalSuccess}
          </div>
        )}
        
        {/* Content Area */}
        <div className="max-h-[450px] overflow-y-auto pr-1">
          {activeTab === '2fa' && (
            <TwoFactorAuth 
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}
          
          {activeTab === 'password' && (
            <PasswordReset 
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}
          
          {activeTab === 'sessions' && (
            <SessionManagement 
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;