import { h } from '../../vdom/createElement';
import { Header } from './Header';
import { MainLayout } from './MainLayout';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { useState } from '../../hooks/useState';

// Helper function to get cookies
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Helper function to redirect to register page
function redirectToRegister(): void {
  window.location.href = '/register'; // or wherever your register page is
}

export const Home: ComponentFunction = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = loading, true = authenticated, false = not authenticated
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get authentication token/session cookie
        const authToken = getCookie('authToken') || getCookie('sessionId') || getCookie('token');
        
        // If no token exists, redirect to register
        if (!authToken) {
          redirectToRegister();
          return;
        }

        // Verify token with backend
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include', // Include cookies in the request
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated || data.valid) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
            redirectToRegister();
          }
        } else {
          // If verification fails, redirect to register
          setIsAuthenticated(false);
          redirectToRegister();
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
        redirectToRegister();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading spinner while checking authentication
  if (isLoading || isAuthenticated === null) {
    return (
      <div
        className="relative flex flex-col items-center justify-center h-screen w-screen"
        style={{ backgroundColor: 'rgba(94, 156, 171, 0.9)' }}
      >
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(/images/bg-home1.png)',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '100% 100%',
          }}
        />
        <div className="relative z-10 text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, this shouldn't render (user should be redirected)
  // but just in case, show nothing
  if (!isAuthenticated) {
    return h('div', {});
  }

  // Render normal home page for authenticated users
  return (
    <div
      className="relative flex flex-col overflow-hidden h-screen w-screen"
      style={{ backgroundColor: 'rgba(94, 156, 171, 0.9)' }}
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/images/bg-home1.png)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 100%',
        }}
      />
      
      <div className="relative z-10">
        <Header />
        <MainLayout />
      </div>
    </div>
  );
}

{/* <App />
│
├── <Header />           // Logo, profile, nav
├── <MainLayout />       // Main content container
│   ├── <Sidebar />      // Navigation icons (e.g., Home, Friends, etc.)
│   ├── <Content />      // Central area for dynamic data
│   │   ├── <GameModes />
│   │   ├── <Matches />
│   │   ├── <Leaderboard />
│   └── <ChatPanel />    // Right-hand side chat panel
└── <Footer />           // Optional */}