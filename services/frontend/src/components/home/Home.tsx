import { h } from '../../vdom/createElement';
import { Header } from './Header';
import { MainLayout } from './MainLayout';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { useState } from '../../hooks/useState';


// export const Home: ComponentFunction = () => {

export const Home: ComponentFunction = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          `http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users/get/me`,
          {
            /// ==========================================================
            // edited by regex - include credentials to send cookies --- IGNORE ---
            /// ==========================================================
            method: "GET",
            credentials: 'include'
            /// ==========================================================
          }
        );

        if (response.ok) 
        {
          setIsAuthenticated(true);
        } 
        else 
        {
          window.history.pushState({}, "", `/login`);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      } catch (err) {
        window.history.pushState({}, "", `/login`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } 
    };

    checkAuth();
  }, []);

  if (isAuthenticated)
  {
    return (
      <div
        className="relative flex flex-col overflow-hidden h-screen w-screen"
        style={{ backgroundColor: "rgba(94, 156, 171, 0.9)" }}
      >
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url(/images/bg-home1.png)",
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%",
          }}
        />
        <div className="relative z-10">
          <Header />
          <MainLayout />
        </div>
      </div>
    );
  }

  return <div></div>;
};

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
