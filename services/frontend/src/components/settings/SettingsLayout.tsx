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
  const { defaultTab = 'overview' } = props || {};
  const [activeTab, setActiveTab] = useState<'profile'|'friends'|'achievements'|'matchHistory'|'overview'>(defaultTab);
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const renderTab = () => {
    switch (activeTab) {
      case 'profile':      return <ProfileSettings />;
      case 'friends':      return <FriendsSettings />;
      case 'achievements': return <AchievementSettings />;
      case 'matchHistory':  return <MatchHistory />;
      case 'overview':      return <OverviewSettings />;
      default:             return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-72px)]">
      <Sidebar/>
      <main className="w-full flex flex-col ">
        {/* Navigation at the top */}
        <nav className="flex  flex-none gap-8 min-w-0 pt-20  pl-16">
          <button
            onClick={() => setActiveTab('overview')}
            style={{ backgroundImage: `url('/images/setting-assests/${activeTab === 'overview' ? 'bg-active.svg' : 'bg-noactive.svg'}')` }}
            className="flex items-center justify-between px-6  w-[130px] text-white bg-no-repeat bg-contain bg-center"
          >
            <span className="font-luckiest text-sm pt-2 whitespace-nowrap">Overview</span>
          </button>
          
          <button
            onClick={() => setActiveTab('friends')}
            style={{ backgroundImage: `url('/images/setting-assests/${activeTab === 'friends' ? 'bg-active.svg' : 'bg-noactive.svg'}')` }}
            className="flex items-center justify-between px-6 py-1 w-[130px] text-white bg-no-repeat bg-contain bg-center"
          >
            <span className="font-luckiest text-sm pt-2 whitespace-nowrap">Friends</span>
          </button>
          
          <button
            onClick={() => setActiveTab('achievements')}
            className="flex items-center justify-between px-6 py-1 w-[130px] text-white bg-no-repeat bg-contain bg-center"
            style={{ backgroundImage: `url('/images/setting-assests/${activeTab === 'achievements' ? 'bg-active.svg' : 'bg-noactive.svg'}')` }}
          >
            <span className="font-luckiest text-sm pt-2 whitespace-nowrap">Achievements</span>
          </button>

          <button
            onClick={() => setActiveTab('matchHistory')}
            className="flex items-center justify-between px-6 py-1 w-[130px] text-white bg-no-repeat bg-contain bg-center"
            style={{ backgroundImage: `url('/images/setting-assests/${activeTab === 'matchHistory' ? 'bg-active.svg' : 'bg-noactive.svg'}')` }}
          >
            <span className="font-luckiest text-sm pt-2 whitespace-nowrap">Match History</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
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