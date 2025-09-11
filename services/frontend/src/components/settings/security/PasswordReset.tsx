import { useState } from "../../../hooks/useState";
import { ComponentFunction } from "../../../types/global";
import { h } from "../../../vdom/createElement";

interface PasswordResetProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const PasswordReset: ComponentFunction<PasswordResetProps> = (props) => {
  const { onSuccess, onError } = props || {};
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const handlePasswordReset = async (e: Event) => {
    e.preventDefault();
    
    console.log('New Password:', newPassword);
    console.log('Confirm Password:', confirmPassword);
    console.log('Current Password:', currentPassword);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      if (onError) onError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      if (onError) onError('Password must be at least 8 characters long');
      return;
    }
    
    setResettingPassword(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(
        `http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/auth/change-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            currentPassword,
            newPassword
          }),
        }
      );

      console.log('Password change response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to change password');
        if (onError) onError(errorData.message || 'Failed to change password');
      } else {
        setSuccess('Password has been successfully changed');
        if (onSuccess) onSuccess('Password has been successfully changed');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('Network error occurred. Please try again.');
      if (onError) onError('Network error occurred. Please try again.');
      console.error('Password change error:', err);
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Change Password</h3>
        <p className="text-gray-200 text-sm">Update your password to keep your account secure</p>
      </div>
      
      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-400 text-green-100 rounded">
          {success}
        </div>
      )}
      
      <form onSubmit={handlePasswordReset} className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-white mb-1">
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onInput={(e: any) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-white/50 focus:border-white disabled:opacity-50"
            placeholder="Enter current password"
            required
          />
        </div>
        
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-white mb-1">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onInput={(e: any) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-white/50 focus:border-white disabled:opacity-50"
            placeholder="Enter new password"
            required
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onInput={(e: any) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-white/50 focus:border-white disabled:opacity-50"
            placeholder="Confirm new password"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {resettingPassword ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

