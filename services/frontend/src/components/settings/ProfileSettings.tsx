import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';

interface Profile {
  id: number;
  username: string;
  email: string;
  birthday: string;
  location:string;
  bio: string;
}

export const ProfileSettings: ComponentFunction = () => {
  const [profile, setProfile] = useState<Profile>({
    id: 1,
    username: "",
    email: "",
    birthday: "",
    location:"",
    bio: "",
  });
  const [initialProfile, setInitialProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewAvatar, setPreviewAvatar] = useState('');

  
  useEffect(() => {
    fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users/update`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setInitialProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);


  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    setProfile({ ...profile, [target.name]: target.value });
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      alert("Profile saved!");
      const updated = await res.json();
      setProfile(updated);
      setInitialProfile(updated);
    } 
    catch (err) 
    {
      console.error(err);
      alert("Error saving profile");
    }
  };
    // Handle avatar change
    const handleAvatarChange = (e: Event) => 
      {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (file) 
      {
        const reader = new FileReader();
        reader.onload = (event) => 
        {
          const newAvatar = event.target?.result as string;
          setPreviewAvatar(newAvatar);
        };
        reader.readAsDataURL(file);
      }
    };

    
  const handleReset = () => {
    if (initialProfile) setProfile(initialProfile);
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen  ">
      <div className="flex gap-5  w-[700px] h-[550px] translate-y-40  ">
        
        <div className="bg-white bg-opacity-75 backdrop-blur-sm rounded-2xl p-4 pt-10 flex-1 shadow-xl">
          <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col items-center mb-8 ">
            <div className="relative w-[140px] h-[140px] mb-1 rounded-full">
              <img
                src={previewAvatar}
                className="absolute  w-32 h-32 rounded-full object-cover z-10"
                alt="Avatar"
                onError={(e: { target: HTMLImageElement; }) => {
                  (e.target as HTMLImageElement).src = "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg";
                }}
                
              />
              <label className="absolute top-1 right-2 bg-white bg-opacity-65 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer z-20">
                <img 
                  src="/images/setting-assests/camera-icone.svg"
                  alt="camera"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        

          <div className="w-full h-20  flex flex-row gap-24 -translate-y-14 translate-x-18 pl-16 ">
            <button
              onClick={handleSave}
              className="flex items-center justify-center w-[160px]
               h-[65px] text-white bg-no-repeat 
               bg-contain bg-center transition-transform 
               duration-200 hover:scale-95"
              style={{ backgroundImage: "url('/images/setting-assests/bg-Save.png')" }}
            >
              <span className="font-luckiest text-2xl whitespace-nowrap">Save</span>
            </button>
            <button
              onClick={{handleReset}}
              className="flex items-center justify-center w-[160px] h-[65px]
               text-white bg-no-repeat 
               bg-contain bg-center transition-transform 
               duration-200 hover:scale-95"
              style={{ backgroundImage: "url('/images/setting-assests/bg-Reset.png')" }}
            >
              <span className="font-luckiest text-2xl whitespace-nowrap">Reset</span>
            </button>
            </div>
          </div>


<div className="grid gap-2  -translate-y-11">
  <div className="grid grid-cols-2 gap-4">
    <input
      name="username"
      value={profile.username}
      onInput={handleChange}
      className="w-full bg-[#91BFBF] border-0 rounded-lg 
      px-4 py-2 focus:outline-none focus:ring-2
       focus:ring-cyan-500 transition-all placeholder-[#FFFFFF] bg-opacity-75"
      placeholder="Username"
    />
  </div>

  <div className="grid grid-cols-1 gap-4">
    <input
      name="email"
      value={profile.email}
      onInput={handleChange}
      className="w-full bg-[#91BFBF] border-0 
      rounded-lg px-4 py-2 focus:outline-none 
      focus:ring-2 focus:ring-cyan-500 transition-all placeholder-[#FFFFFF] bg-opacity-75"
      placeholder="Email"
    />
  </div>

  <div className="grid grid-cols-2 gap-4">
    <input
      name="location"
      value={profile.location}
      onInput={handleChange}
      className="w-full bg-[#91BFBF] border-0 
        rounded-lg px-4 py-2 focus:outline-none 
        focus:ring-2 focus:ring-cyan-500 transition-all placeholder-[#FFFFFF] bg-opacity-75"
      placeholder="location"
    />
    <input
      name="birthday"
      value={profile.birthday}
      onInput={handleChange}
      className="w-full bg-[#91BFBF] border-0 rounded-lg px-4 
      py-2 focus:outline-none focus:ring-2
       focus:ring-cyan-500 transition-all placeholder-[#FFFFFF] bg-opacity-75"
       placeholder="Birth Date"
    />
  </div>

  <div className="grid grid-cols-1 gap-4">
    <textarea
      name="bio"
      value={profile.bio}
      onInput={handleChange}
      rows={7}
      className="w-full bg-[#91BFBF] border-0 
      rounded-lg px-4 py-3 focus:outline-none focus:ring-2 
      focus:ring-cyan-500 transition-all resize-none placeholder-[#FFFFFF] bg-opacity-75"
      placeholder="Bio"
    />
  </div>
</div>


        </div>

        {/* Profile Preview Card */}
        {/* <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 flex-shrink-0 w-80">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden shadow-lg">
              <img 
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='15' fill='%23FFF'/%3E%3Cpath d='M25 75 Q25 55 50 55 Q75 55 75 75 L75 85 L25 85 Z' fill='%23FFF'/%3E%3C/svg%3E"
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-white text-xl font-semibold mb-1">{profile.username || 'User Name'}</h2>
            <p className="text-white/80 text-sm mb-1">{profile.email}</p>
            <p className="text-white/70 text-xs mb-1">{profile.location}</p>
            <p className="text-white/70 text-xs">{profile.birthday}</p>
          </div>
        </div> */}
      </div>
    </div>
  );
};



