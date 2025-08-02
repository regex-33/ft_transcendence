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


export const SettingsLayout: ComponentFunction = () => {
  const [activeTab, setActiveTab] = useState<'profile'|'friends'|'achievements'|'matchHistory'|'overview'>('overview');

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
    <main className="w-full flex flex-col  items-center justify-center  px-2 mr-28 pr-56">

  <nav className="flex gap-3 md:gap-5 flex-none justify-between min-w-0 -mt-[720px]">
 <button
           onClick={() => setActiveTab('overview')}
           style={{ backgroundImage: `url('/images/setting-assests/${activeTab === 'overview' ? 'bg-active.svg' : 'bg-noactive.svg'}')` }}
           className="mt-2 flex items-center justify-between px-6 py-1 w-[180px] text-white bg-no-repeat bg-contain bg-center"
       >
                <span className="font-luckiest text-base pt-2 whitespace-nowrap">Overview</span>
  </button>
   <button
            onClick={() => setActiveTab('friends')}
            style={{ backgroundImage: `url('/images/setting-assests/${activeTab === 'friends' ? 'bg-active.svg' : 'bg-noactive.svg'}')` }}
                class="mt-2 flex items-center justify-between px-6 py-1 w-[180px] text-white bg-no-repeat bg-contain bg-center"
            >
                <span class="font-luckiest text-base pt-2 whitespace-nowrap">Friends</span>
  </button>
  <button
                onClick={() => setActiveTab('achievements')}
                className="mt-2 flex items-center justify-between px-6 py-1 w-[180px] text-white bg-no-repeat bg-contain bg-center"
                style={{ backgroundImage: `url('/images/setting-assests/${activeTab === 'achievements' ? 'bg-active.svg' : 'bg-noactive.svg'}')` }}
            >
                <span className="font-luckiest text-base pt-2 whitespace-nowrap">Achievements</span>
  </button>

  <button
                onClick={() => setActiveTab('matchHistory')}
                className="mt-2 flex items-center justify-between px-6 py-1 w-[180px] text-white bg-no-repeat bg-contain bg-center"
                style={{ backgroundImage: `url('/images/setting-assests/${activeTab === 'matchHistory' ? 'bg-active.svg' : 'bg-noactive.svg'}')` }}
            >
                <span className="font-luckiest text-base pt-2 whitespace-nowrap">Match History</span>
  </button>

 <button
                onClick={() => setActiveTab('profile')}
                className="mt-2 flex items-center justify-between px-6 py-1 w-[180px] text-white bg-no-repeat bg-contain bg-center"
                style={{ backgroundImage: `url('/images/setting-assests/${activeTab === 'profile' ? 'bg-active.svg' : 'bg-noactive.svg'}')` }}
            >
                <span className="font-luckiest text-base pt-2 whitespace-nowrap">Edit Profile</span>
  </button>
</nav>
        {renderTab()}
      </main>
    </div>
  );
};
