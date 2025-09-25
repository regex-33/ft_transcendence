import { useState } from "../../hooks/useState";
import { ComponentFunction } from "../../types/global";
import { h } from "../../vdom/createElement";
import { TwoFactorAuth } from "./security/TwoFactorAuth";
import { SessionManagement } from "./security/SessionManagement";
import { PasswordReset } from "./security/PasswordReset";

export const SecuritySettings: ComponentFunction = (props) => {
  const [activeTab, setActiveTab] = useState<'2fa' | 'password' | 'sessions'>('2fa');

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
        
        {/* Content Area */}
        <div className="max-h-[450px] overflow-y-auto pr-1 relative">
          <div className={`transition-opacity duration-300 ${activeTab === '2fa' ? 'opacity-100' : 'opacity-0 absolute invisible w-full'}`}>
            <TwoFactorAuth />
          </div>
          
          <div className={`transition-opacity duration-300 ${activeTab === 'password' ? 'opacity-100' : 'opacity-0 absolute invisible w-full'}`}>
            <PasswordReset />
          </div>
          
          <div className={`transition-opacity duration-300 ${activeTab === 'sessions' ? 'opacity-100' : 'opacity-0 absolute invisible w-full'}`}>
            <SessionManagement />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;