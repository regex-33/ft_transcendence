import { h } from '../../vdom/createElement';
import { Header } from '../home/Header';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { SettingsLayout } from './SettingsLayout';

interface SettingsPageProps {
  defaultTab?: 'profile' | 'friends' | 'achievements' | 'matchHistory' | 'overview' | 'security';
}

export const SettingsPage: ComponentFunction<SettingsPageProps> = (props) => {
  const { defaultTab = "matchHistory" } = props || {};
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users/get/me`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
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
      finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);
  
  if (loading) {
    return <div className="text-white p-4">Checking authentication...</div>;
  }

  // if (!authenticated) {
  //   return <div />; // redirecting already
  // }
  if (isAuthenticated)
    {
  return (
    <div
      className="relative flex flex-col overflow-hidden h-screen w-screen"
      style={{ backgroundColor: 'rgba(94, 156, 171, 0.4)' }}
    >
      
      <div className="relative z-10">
        <Header />
        <SettingsLayout defaultTab={defaultTab} />
      </div>
    </div>
  );
}

  return <div className="h-[100vh] w-[100vw] bg-red-600 z-[9999]"></div>;
};

{/* 
  <SettingsPage />
  ├── <Header />          
  ├── <SettingsLayout />   
  │   ├── <Sidebar />      
  │   └── <MainContent /> 
  └── <Footer />
*/}