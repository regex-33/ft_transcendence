import { useEffect } from "../../hooks/useEffect";
import { useRef } from "../../hooks/useRef";
import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { ProfileSettings } from './ProfileSettings';
import { FriendsSettings } from './FriendsSettings';
import { MatchHistory } from './MatchHistory';
import { OverviewSettings} from './OverviewSettings';
import { SecuritySettings } from './SecuritySettings';
import { Sidebar } from "./Sidebar";

interface SettingsLayoutProps {
  defaultTab?: 'profile' | 'friends' | 'achievements' | 'matchHistory' | 'overview' | 'security';
}

export const SettingsLayout: ComponentFunction<SettingsLayoutProps> = (props) => {
  const { defaultTab = 'matchHistory' } = props || {};
  const [activeTab, setActiveTab] = useState<'profile'|'friends'|'achievements'|'matchHistory'|'overview'|'security'>(defaultTab);
  const [updateAll, setUpdateAll] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    birthday: '',
    location: '',
    avatar: ''
  });
  
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (updateAll) {
      const timer = setTimeout(() => {
        setUpdateAll(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [updateAll]);

  const renderAllTabs = () => (
    <div>
      <div className={`transition-opacity duration-200 ${activeTab === 'profile' ? 'opacity-100' : 'opacity-0 absolute invisible'}`}>
        <ProfileSettings setUpdateAll={setUpdateAll} profileData={profileData} />
      </div>
      
      <div className={`transition-opacity duration-200 ${activeTab === 'friends' ? 'opacity-100' : 'opacity-0 absolute invisible'}`}>
        <FriendsSettings />
      </div>
      
      <div className={`transition-opacity duration-200 ${activeTab === 'matchHistory' ? 'opacity-100' : 'opacity-0 absolute invisible'}`}>
        <MatchHistory />
      </div>
      
      <div className={`transition-opacity duration-200 ${activeTab === 'overview' ? 'opacity-100' : 'opacity-0 absolute invisible'}`}>
        <OverviewSettings />
      </div>
      
      <div className={`transition-opacity duration-200 ${activeTab === 'security' ? 'opacity-100' : 'opacity-0 absolute invisible'}`}>
        <SecuritySettings />
      </div>
    </div>
  );

  const handleTabClick = (tab: typeof activeTab, e: Event) => {
    e.preventDefault();
    setActiveTab(tab);
    window.history.replaceState({}, '', `/settings/${tab}`);
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

          <button
            onClick={(e: Event) => handleTabClick('security', e)}
            className="flex items-center justify-between px-6 py-1 w-[130px] text-white bg-no-repeat bg-contain bg-center flex-shrink-0"
            style={{ backgroundImage: `url('/images/setting-assests/${activeTab === 'security' ? 'bg-active.svg' : 'bg-noactive.svg'}')` }}
          >
            <span className="font-luckiest text-sm pt-2 whitespace-nowrap">Security</span>
          </button>
        </nav>
        
        <div className="flex-1 w-full relative">
          {renderAllTabs()}
        </div>
      </main>
    </div>
  );
};
