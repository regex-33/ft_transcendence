import { h } from '../../vdom/createElement';
import { Header } from '../home/Header';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { SettingsLayout } from './SettingsLayout';

interface SettingsPageProps {
  defaultTab?: 'profile' | 'friends' | 'achievements' | 'matchHistory' | 'overview';
}

export const SettingsPage: ComponentFunction<SettingsPageProps> = (props) => {
  const { defaultTab = "matchHistory" } = props || {};
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          `http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users/get/me`,
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
    };

    checkAuth();
  }, []);

  // if (loading) {
  //   return <div className="text-white p-4">Checking authentication...</div>;
  // }

  // if (!authenticated) {
  //   return <div />; // redirecting already
  // }
  if (isAuthenticated)
    {
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
        <SettingsLayout defaultTab={defaultTab} />
      </div>
    </div>
  );
}

return <div></div>;
};

{/* 
  <SettingsPage />
  ├── <Header />          
  ├── <SettingsLayout />   
  │   ├── <Sidebar />      
  │   └── <MainContent /> 
  └── <Footer />
*/}