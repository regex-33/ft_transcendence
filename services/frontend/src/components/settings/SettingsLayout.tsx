import { useEffect } from "../../hooks/useEffect";
import { useRef } from "../../hooks/useRef";
import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { ProfileSettings } from './ProfileSettings';
import { FriendsSettings } from './FriendsSettings';
import { AchievementSettings } from './AchievementSettings';
import { MatchHistory } from './MatchHistory';
import { OverviewSettings} from './OverviewSettings';
import { Sidebar } from "./Sidebar";

interface SettingsLayoutProps {
  defaultTab?: 'profile' | 'friends' | 'achievements' | 'matchHistory' | 'overview';
}

export const SettingsLayout: ComponentFunction<SettingsLayoutProps> = (props) => {
  const { defaultTab = 'matchHistory' } = props || {};
  const [activeTab, setActiveTab] = useState<'profile'|'friends'|'achievements'|'matchHistory'|'overview'>(defaultTab);
  const [updateAll, setUpdateAll] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Loading...',
    email: '',
    birthday: '',
    location: '',
    avatar: ''
  });
  
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

 
  useEffect(() => {
    if (updateAll) 
      {
      const timer = setTimeout(() => {
        setUpdateAll(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [updateAll]);

  const renderTab = () => {
    switch (activeTab) {
      case 'profile':      return <ProfileSettings setUpdateAll={setUpdateAll} profileData={profileData} />;
      case 'friends':      return <FriendsSettings />;
      case 'matchHistory':  return <MatchHistory />;
      case 'overview':      return <OverviewSettings />;
      default:             return null;
    }
  };

  const handleTabClick = (tab: typeof activeTab, e: Event) => {
    e.preventDefault();
    setActiveTab(tab);
    window.history.pushState({}, '', `/settings/${tab}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="flex h-[calc(100vh-72px)]">
      <Sidebar updateAll={updateAll} profileData={profileData} setProfileData={setProfileData}/>
      <main className="w-full flex flex-col ">
        <nav className="flex  flex-none gap-8 min-w-0 pt-16  pl-5">
          <button
            onClick={(e: Event) => handleTabClick('overview', e)}
            style={{ backgroundImage: `url('/images/setting-assests/${activeTab === 'overview' ? 'bg-active.svg' : 'bg-noactive.svg'}')` }}
            className="flex items-center justify-between px-6  w-[130px] text-white bg-no-repeat bg-contain bg-center"
          >
            <span className="font-luckiest text-sm pt-2 whitespace-nowrap">Overview</span>
          </button>
          
          <button
            onClick={(e: Event) => handleTabClick('friends', e)}
            style={{ backgroundImage: `url('/images/setting-assests/${activeTab === 'friends' ? 'bg-active.svg' : 'bg-noactive.svg'}')` }}
            className="flex items-center justify-between px-6 py-1 w-[130px] text-white bg-no-repeat bg-contain bg-center"
          >
            <span className="font-luckiest text-sm pt-2 whitespace-nowrap">Friends</span>
          </button>
          <button
            onClick={(e: Event) => handleTabClick('matchHistory', e)}
            className="flex items-center justify-between px-6 py-1 w-[130px] text-white bg-no-repeat bg-contain bg-center"
            style={{ backgroundImage: `url('/images/setting-assests/${activeTab === 'matchHistory' ? 'bg-active.svg' : 'bg-noactive.svg'}')` }}
          >
            <span className="font-luckiest text-sm pt-2 whitespace-nowrap">Match History</span>
          </button>

          <button
            onClick={(e: Event) => handleTabClick('profile', e)}
            className="flex items-center justify-between px-6 py-1 w-[130px] text-white bg-no-repeat bg-contain bg-center"
            style={{ backgroundImage: `url('/images/setting-assests/${activeTab === 'profile' ? 'bg-active.svg' : 'bg-noactive.svg'}')` }}
          >
            <span className="font-luckiest text-sm pt-2 whitespace-nowrap">Edit Profile</span>
          </button>
        </nav>
        
        <div className="flex-1 w-full">
          {renderTab()}
        </div>
      </main>
    </div>
  );
};