import { h } from '../../vdom/createElement';
import { ComponentFunction, process } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { useState } from '../../hooks/useState';

export const Sidebar: ComponentFunction = ({updateAll, profileData, setProfileData}) => {
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setError('');
        const response = await fetch(
          `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users/get/me`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          }
        );

        if (response.ok) {
          const data = await response.json();
          const newProfileData = {
            name: data.username || '',
            email: data.email || '',
            aboutMe: data.bio || '',
            birthday: data.birthday || '',
            location: data.location || '',
            avatar: data.avatar || ""
          };
          setProfileData(newProfileData);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Failed to load profile data');
        setProfileData({
          name: 'Error Loading',
          email: '',
          aboutMe: 'Could not load profile information. Please try refreshing the page.',
          birthday: 'Not available',
          location: 'Not available',
          avatar: ""
        });
      } finally {
        // setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [updateAll]);

  return (
    <aside className="w-[30%] h-full p-2">
      <div className="w-[310px] h-[740px] bg-[#5E9CAB] rounded-xl bg-opacity-35 text-white p-3 shadow-lg relative ml-9 mt-10">
        
        {/* Fixed header section with proper flex layout */}
        <div className="flex flex-col items-center text-center w-full">
          <div className="flex items-center justify-center gap-2 w-full mb-4">
            
            {/* Avatar container with fixed positioning */}
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
            
            {/* Name with fixed width to prevent layout shift */}
            <div className="flex-1 max-w-[150px]">
              <h2 className="text-2xl font-bold truncate">
                {profileData?.name || 'Loading...'}
              </h2>
            </div>
          </div>
        </div>
        
        {/* About Me section with fixed layout */}
        <div className="mt-8 space-y-4 pl-7">
          <h3 className="text-lg font-bold mb-2">About me</h3>
          
          {/* Content container with min-height to prevent layout jumping */}
          <div className="min-h-[60px]">
            {error ? (
              <p className="text-sm text-red-200 break-words">{error}</p>
            ) : (
              <p className="text-sm text-gray-200 break-words">
                {profileData?.aboutMe || 'No bio available'}
              </p>
            )}
          </div>
        </div>
        
        {/* Info section with consistent spacing */}
        <div className="mt-6 space-y-2 text-sm pl-5">
          <div className="flex items-center gap-2 min-h-[32px]">
            <img
              src="/images/setting-assests/birthday.svg"
              alt="Birthday"
              className="w-8 h-8 flex-shrink-0"
            />
            <span className="text-white truncate">
              {(profileData?.birthday || 'Not specified')}
            </span>
          </div>

          <div className="flex items-center gap-2 min-h-[32px]">
            <img
              src="/images/setting-assests/location.svg"
              alt="Location"
              className="w-8 h-8 flex-shrink-0"
            />
            <span className="text-white truncate">
              {(profileData?.location || 'Not specified')}
            </span>
          </div>  
        </div>
      </div>
    </aside>
  );
};