import { useState } from "../../../hooks/useState";
import { useEffect } from "../../../hooks/useEffect";
import { ComponentFunction } from "../../../types/global";
import { h } from "../../../vdom/createElement";

export const PasswordReset: ComponentFunction = (props) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

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

  const handlePasswordReset = async (e: Event) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setResettingPassword(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/auth/change-password`,
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

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to change password');
      } else {
        setSuccess('Password has been successfully changed');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('Network error occurred. Please try again.');
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