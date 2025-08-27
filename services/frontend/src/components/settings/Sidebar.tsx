import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { useState } from '../../hooks/useState';

export const Sidebar: ComponentFunction = () => {
  // Local state for profile data fetched from API
  const [profileData, setProfileData] = useState({
    name: 'Loading...',
    email: '',
    aboutMe: 'Loading profile information...',
    birthday: '',
    location: '',
    avatar: '/images/default-avatar.png' // fallback avatar
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch profile data from API on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Update profile data with fetched information
          setProfileData({
            name: data.name || 'Unknown User',
            email: data.email || '',
            aboutMe: data.aboutMe || 'No bio available',
            birthday: data.birthday || 'Not specified',
            location: data.location || 'Not specified',
            avatar: data.avatar || "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg"
          });
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Failed to load profile data');
        
        // Set fallback data on error
        setProfileData({
          name: 'Error Loading',
          email: '',
          aboutMe: 'Could not load profile information. Please try refreshing the page.',
          birthday: 'Not available',
          location: 'Not available',
          avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  return (
    <aside className="w-[30%] h-full p-2">
      <div className="w-[310px] h-[740px] bg-[#5E9CAB] rounded-xl bg-opacity-35 text-white p-3 shadow-lg relative ml-9 mt-10">
        <div className="flex flex-col items-center text-center w-full pr-20">
          <div className="flex items-center justify-center gap-2 w-full">
            <div className="relative w-[85px] h-[85px] flex-shrink-0">
              <img
                src="/images/home-assests/cir-online.svg"
                className="absolute inset-0 w-full h-full z-0"
                alt="Online circle"
              />
              <img
                src={profileData.avatar}
                className="absolute inset-[10px] w-16 h-16 rounded-full object-cover z-10"
                alt="Avatar"
                onError={(e: { target: HTMLImageElement; }) => {
                  // Fallback to default avatar if image fails to load
                  (e.target as HTMLImageElement).src = "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg";
                }}
              />
            </div>
            <h2 className="text-2xl font-bold truncate max-w-[120px]">
              {isLoading ? 'Loading...' : profileData.name}
            </h2>
          </div>
          <button
            className="mt-2 flex items-center justify-between px-6 py-1 w-[180px] text-white bg-no-repeat bg-contain bg-center"
            style={{ backgroundImage: "url('/images/setting-assests/bg-add-friends.svg')" }}
          >
            <span className="font-luckiest text-base pt-2 whitespace-nowrap">ADD AS FRIEND</span>
            <img
              src="/images/setting-assests/plus-friends.svg"
              alt="Add"
              className="w-8 h-8 ml-4 transition-transform duration-200 hover:scale-95"
            />
          </button>
        </div>
        
        <div className="mt-16 space-y-4 pl-7">
          <h3 className="text-lg font-bold mb-2">About me</h3>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-3/4"></div>
            </div>
          ) : error ? (
            <p className="text-sm text-red-200 break-words">{error}</p>
          ) : (
            <p className="text-sm text-gray-200 break-words">
              {profileData.aboutMe}
            </p>
          )}
        </div>
        
        <div className="mt-6 space-y-2 text-sm pl-5">
          <div className="flex items-center gap-2">
            <img
              src="/images/setting-assests/birthday.svg"
              alt="Birthday"
              className="w-8 h-8"
            />
            <span className="text-white">
              {isLoading ? 'Loading...' : profileData.birthday}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <img
              src="/images/setting-assests/location.svg"
              alt="Location"
              className="w-8 h-8"
            />
            <span className="text-white">
              {isLoading ? 'Loading...' : profileData.location}
            </span>
          </div>  
        </div>
      </div>
    </aside>
  );
};