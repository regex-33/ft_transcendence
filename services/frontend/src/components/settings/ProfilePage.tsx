import { h } from '../../vdom/createElement';
import { Header } from '../home/Header';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { OverviewSettings } from './OverviewSettings';

interface ProfilePageProps {
  username?: string;
}

interface ProfileData {
  name: string;
  email: string;
  aboutMe: string;
  birthday: string;
  location: string;
  avatar: string;
  isCurrentUser: boolean;
}
const defaultProfile: ProfileData = {
    name: '',
    email: '',
    aboutMe: '',
    birthday: '',
    location: '',
    avatar: '',
    isCurrentUser: false
};
export const ProfilePage: ComponentFunction<ProfilePageProps> = (props) => {
  const { username } = props || {};
  const [profileData, setProfileData] = useState<ProfileData>(defaultProfile)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const currentUserResponse = await fetch(
          `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users/get/me`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include'
          }
        );

        if (!currentUserResponse.ok) {
          window.history.pushState({}, "", `/login`);
          window.dispatchEvent(new PopStateEvent("popstate"));
          return;
        }

        const currentUserData = await currentUserResponse.json();
        setCurrentUser(currentUserData.username);

        const isViewingOwnProfile = !username || username === currentUserData.username;
        if (isViewingOwnProfile) {
          window.history.pushState({}, "", `/settings/overview`);
          window.dispatchEvent(new PopStateEvent("popstate"));
          return;
        }

        // Fetch the target user's profile data
        const profileResponse = await fetch(
          `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users/${username}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include'
          }
        );

        if (!profileResponse.ok) {
          throw new Error(`User not found: ${username}`);
        }

        const userData = await profileResponse.json();
        
        setProfileData({
          name: userData.username || '',
          email: userData.email || '',
          aboutMe: userData.bio || '',
          birthday: userData.birthday || '',
          location: userData.location || '',
          avatar: userData.avatar || "",
          isCurrentUser: false
        });

      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  if (loading) {
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
          <div className="flex items-center justify-center h-96">
            <div className="text-white text-xl">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
          <div className="flex items-center justify-center h-96">
            <div className="text-red-400 text-xl">{error}</div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex h-[calc(100vh-72px)]">
          <ProfileSidebar profileData={profileData} />
          
          <main className="w-full flex flex-col">
            <nav className="flex flex-none gap-8 min-w-0 pt-16 pl-5">
              <div
                style={{ backgroundImage: `url('/images/setting-assests/bg-active.svg')` }}
                className="flex items-center justify-between px-6 w-[130px] text-white bg-no-repeat bg-contain bg-center"
              >
                <span className="font-luckiest text-sm pt-2 whitespace-nowrap">Profile</span>
              </div>
            </nav>
            
            <div className="flex-1 w-full relative">
              <ProfileOverview profileData={profileData} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// Custom sidebar component for profile viewing
const ProfileSidebar: ComponentFunction<{profileData: ProfileData}> = ({profileData}) => {
  return (
    <aside className="w-[30%] h-full p-2">
      <div className="w-[310px] h-[740px] bg-[#5E9CAB] rounded-xl bg-opacity-35 text-white p-3 shadow-lg relative ml-9 mt-10">
        
        {/* Profile header */}
        <div className="flex flex-col items-center text-center w-full">
          <div className="flex items-center justify-center gap-2 w-full mb-4">
            
            {/* Avatar container */}
            <div className="relative w-[100px] h-[100px] flex-shrink-0">
              <img
                src="/images/home-assests/cir-online.svg"
                className="absolute inset-0 w-full h-full z-0"
                alt="Online circle"
              />
              <img
                src={profileData?.avatar || "/images/default.jpg"}
                className="absolute inset-[11px] w-20 h-20 rounded-full object-cover z-10"
                alt="Avatar"
                onError={(e: Event) => {
                  const img = e.target as HTMLImageElement;
                  img.src = "/images/default.jpg";
                }}
              />
            </div>
            
            {/* Name */}
            <div className="flex-1 max-w-[150px]">
              <h2 className="text-2xl font-bold truncate">
                {profileData?.name || 'Unknown User'}
              </h2>
            </div>
          </div>
        </div>
        
        {/* About Me section */}
        <div className="mt-8 space-y-4 pl-7">
          <h3 className="text-lg font-bold mb-2">About me</h3>
          
          <div className="min-h-[60px]">
            <p className="text-sm text-gray-200 break-words">
              {profileData?.aboutMe || 'No bio available'}
            </p>
          </div>
        </div>
        
        {/* Info section */}
        <div className="mt-6 space-y-2 text-sm pl-5">
          <div className="flex items-center gap-2 min-h-[32px]">
            <img
              src="/images/setting-assests/birthday.svg"
              alt="Birthday"
              className="w-8 h-8 flex-shrink-0"
            />
            <span className="text-white truncate">
              {profileData?.birthday || 'Not specified'}
            </span>
          </div>

          <div className="flex items-center gap-2 min-h-[32px]">
            <img
              src="/images/setting-assests/location.svg"
              alt="Location"
              className="w-8 h-8 flex-shrink-0"
            />
            <span className="text-white truncate">
              {profileData?.location || 'Not specified'}
            </span>
          </div>  
        </div>
      </div>
    </aside>
  );
};

const ProfileOverview: ComponentFunction<{profileData: ProfileData}> = ({profileData}) => {
  return <OverviewSettings username={profileData.name} />;
};