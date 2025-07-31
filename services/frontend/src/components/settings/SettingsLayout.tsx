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
  const [activeTab, setActiveTab] = useState<'profile'|'friends'|'achievements'|'matchHistory'|'overview'>('profile');

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
      {/* Sidebar for navigation */}
      <Sidebar/>

      <main className="w-full flex flex-col items-center bg-red-300 justify-center relative px-3 sm:px-6 md:px-8 mx-auto">
        <div className="hidden sm:flex items-center justify-around w-1/2  md:px-2 h-[64px] relative left-12 top-1">
      <nav className="w-1/4 bg-gray-100 p-4">
        <button onClick={() => setActiveTab('profile')}     className="block w-full text-left py-2">Edit Profile</button>

        <button onClick={() => setActiveTab('friends')}     className="block w-full text-left py-2">Friends</button>

        <button onClick={() => setActiveTab('achievements')}className="block w-full text-left py-2">Achievements</button>

        <button onClick={() => setActiveTab('matchHistory')} className="block w-full text-left py-2">Match History</button>

        <button onClick={() => setActiveTab('overview')} className="block w-full text-left py-2">Overview</button>
        
      </nav>
      </div>
        {renderTab()}
      </main>
    </div>
  );
};
