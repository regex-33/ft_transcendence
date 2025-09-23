import { useEffect } from "../../../hooks/useEffect";
import { useState } from "../../../hooks/useState";
import { ComponentFunction } from "../../../types/global";
import { h } from "../../../vdom/createElement";

type Session = {
  id: string;
  userAgent?: string;
  deviceInfo?: string;
  ipAddress?: string;
  lastActive?: string;
};

interface SessionManagementProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const SessionManagement: ComponentFunction<SessionManagementProps> = (props) => {
  const { onSuccess, onError } = props || {};
  
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const fetchActiveSessions = async () => {
    setLoadingSessions(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/auth/sessions`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data.sessions || []);
      } else {
        console.error('Failed to fetch active sessions');
        setError('Failed to fetch active sessions');
        if (onError) onError('Failed to fetch active sessions');
      }
    } catch (err) {
      console.error('Error fetching active sessions:', err);
      setError('Network error while fetching sessions');
      if (onError) onError('Network error while fetching sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/auth/sessions/${sessionId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (response.ok) {
        setSuccess('Session terminated successfully');
        if (onSuccess) onSuccess('Session terminated successfully');
        fetchActiveSessions(); // Refresh the list
      } else {
        setError('Failed to terminate session');
        if (onError) onError('Failed to terminate session');
      }
    } catch (err) {
      setError('Network error occurred. Please try again.');
      if (onError) onError('Network error occurred. Please try again.');
      console.error('Session termination error:', err);
    }
  };

  const terminateAllOtherSessions = async () => {
    if (!window.confirm('Are you sure you want to terminate all other sessions? This will log you out from all other devices.')) {
      return;
    }
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/auth/sessions`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (response.ok) {
        setSuccess('All other sessions terminated successfully');
        if (onSuccess) onSuccess('All other sessions terminated successfully');
        fetchActiveSessions(); // Refresh the list
      } else {
        setError('Failed to terminate sessions');
        if (onError) onError('Failed to terminate sessions');
      }
    } catch (err) {
      setError('Network error occurred. Please try again.');
      if (onError) onError('Network error occurred. Please try again.');
      console.error('Sessions termination error:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile')) {
      return '📱';
    } else if (userAgent.includes('Mac') || userAgent.includes('Windows')) {
      return '💻';
    } else {
      return '🖥️';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">Active Sessions</h3>
          <p className="text-gray-200 text-sm">Manage your account's active sessions</p>
        </div>
        <button
          onClick={fetchActiveSessions}
          className="flex items-center text-sm text-white hover:text-gray-300 bg-white/10 px-3 py-1 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Refresh
        </button>
      </div>

      {loadingSessions ? (
        <div className="flex justify-center py-8">
          <div className="text-white">Loading sessions...</div>
        </div>
      ) : activeSessions.length === 0 ? (
        <div className="text-center py-8 text-gray-200 bg-white/10 rounded-lg">
          No active sessions found
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white/10 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-white">Current Session</h4>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-200 text-xs font-medium rounded-full border border-blue-400">
                This device
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-300">Device:</span>
                <div className="flex items-center mt-1">
                  <span className="text-lg mr-2">{getDeviceIcon(activeSessions[0]?.userAgent || '')}</span>
                  <span className="text-white">{activeSessions[0]?.deviceInfo || 'Unknown device'}</span>
                </div>
              </div>
              <div>
                <span className="text-gray-300">Location:</span>
                <p className="mt-1 text-white">{activeSessions[0]?.ipAddress || 'Unknown location'}</p>
              </div>
              <div>
                <span className="text-gray-300">Last Active:</span>
                <p className="mt-1 text-white">{formatDate(activeSessions[0]?.lastActive)}</p>
              </div>
            </div>
          </div>
          
          {activeSessions.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-white">Other Active Sessions</h4>
                <button
                  onClick={terminateAllOtherSessions}
                  className="text-sm text-red-300 hover:text-red-200 bg-red-500/20 px-3 py-1 rounded-lg transition-colors"
                >
                  Terminate All Other Sessions
                </button>
              </div>
              
              <div className="space-y-3">
                {activeSessions.slice(1).map((session: any) => (
                  <div key={session.id} className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-300">Device:</span>
                        <div className="flex items-center mt-1">
                          <span className="text-lg mr-2">{getDeviceIcon(session.userAgent || '')}</span>
                          <span className="text-white">{session.deviceInfo || 'Unknown device'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-300">Location:</span>
                        <p className="mt-1 text-white">{session.ipAddress || 'Unknown location'}</p>
                      </div>
                      <div>
                        <span className="text-gray-300">Last Active:</span>
                        <p className="mt-1 text-white">{formatDate(session.lastActive)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => terminateSession(session.id)}
                        className="text-sm text-red-300 hover:text-red-200 bg-red-500/20 px-3 py-1 rounded-lg transition-colors"
                      >
                        Terminate Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};