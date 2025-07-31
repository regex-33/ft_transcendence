import { h } from '../../vdom/createElement';
import { Header } from './Header';
import { MainLayout } from './MainLayout';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';


export const Home: ComponentFunction = () => {

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
