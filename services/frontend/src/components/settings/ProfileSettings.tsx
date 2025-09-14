import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';

interface Profile {
  avatar: string;
  id: number;
  username: string;
  email: string;
  birthday: string;
  location: string;
  bio: string;
}

const defaultProfile: Profile = {
  id: 1,
  username: "",
  email: "",
  birthday: "",
  location: "",
  bio: "",
  avatar: "",
};

export const ProfileSettings: ComponentFunction = ({setUpdateAll, profileData}) => {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [initialProfile, setInitialProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(profileData?.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (profileData && Object.keys(profileData).length > 0) {
      const profileFromData = {
        id: profileData.id || 1,
        username: profileData.username || "",
        email:  "",
        birthday: profileData.birthday || "",
        location: profileData.location || "",
        bio: profileData.bio || "",
        avatar: profileData.avatar || "",
      };
      
      setProfile(profileFromData);
      setInitialProfile(profileFromData);
      setPreviewAvatar(profileData.avatar || "");
      setLoading(false);
    }
  }, [profileData]);

  const handleReset = () => {
    if (!initialProfile) {
      console.warn("No initial profile data to reset to");
      return;
    }
    
    setProfile(initialProfile);
    setPreviewAvatar(initialProfile.avatar || profileData?.avatar || "");
    setAvatarFile(null);
  };

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    setProfile({ ...profile, [target.name]: target.value });
  };

  const getChangedFields = () => {
    if (!initialProfile || !profile) return {};
  
    const changes: any = {};
  

    if (profile && typeof profile === 'object') {
      Object.keys(profile).forEach(key => {
        if (key === 'id' || key === 'avatar') return;
  
        const currentValue = (profile as any)[key];
        const initialValue = (initialProfile as any)[key];
  
        if (typeof currentValue === "string" && currentValue !== initialValue && currentValue.trim() !== "") {
          changes[key] = currentValue;
        }      
      });
    }
  
    return changes;
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      const changedFields = getChangedFields() || {};  
      Object.keys(changedFields).forEach(key => {
        formData.append(key, changedFields[key]);
      });
      
      // Add avatar if changed
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      
      // Check if there are any changes
      if (Object.keys(changedFields).length === 0 && !avatarFile) {
        alert("No changes to save!");
        return;
      }
      
      const res = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users/update`, {
        method: "PUT",
        credentials: 'include',
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save profile");
      }
      
      const updated = await res.json();
      
      alert("Profile saved!");
      
      // Update states with new data
      setUpdateAll(true);
      setProfile(updated);
      setInitialProfile(updated);
      
      if (updated.avatar) {
        setPreviewAvatar(updated.avatar);
      }
      
      setAvatarFile(null);
    } 
    catch (err) {
      const error = err as Error;
      alert(`Error saving profile: ${error.message}`);
    }
  };

  const handleAvatarChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      setAvatarFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAvatar = event.target?.result as string;
        setPreviewAvatar(newAvatar);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex gap-5 w-[700px] h-[550px] translate-y-40">
        
        <div className="bg-white bg-opacity-75 backdrop-blur-sm rounded-2xl p-4 pt-10 flex-1 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-[140px] h-[140px] mb-1 rounded-full">
                <img
                  src={previewAvatar || profileData?.avatar || ""}
                  className="absolute w-32 h-32 rounded-full object-cover z-10"
                  alt="Avatar"
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

            <div className="w-full h-20 flex flex-row gap-24 -translate-y-14 translate-x-18 pl-16">
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
                onClick={handleReset}
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

          <div className="grid gap-2 -translate-y-16">
            <div className="grid grid-cols-2 gap-4">
              <input
                name="username"
                value={profile.username || ""}
                onChange={handleChange}
                className="w-full bg-[#91BFBF] border-0 rounded-lg 
                px-4 py-2 focus:outline-none focus:ring-2
                 focus:ring-cyan-500 transition-all placeholder-[#FFFFFF] bg-opacity-75"
                placeholder="Username"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <input
                name="email"
                value={profile.email || ""}
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
                value={profile.location || ""}
                onInput={handleChange}
                className="w-full bg-[#91BFBF] border-0 
                  rounded-lg px-4 py-2 focus:outline-none 
                  focus:ring-2 focus:ring-cyan-500 transition-all placeholder-[#FFFFFF] bg-opacity-75"
                placeholder="location"
              />
              <input
                name="birthday"
                value={profile.birthday || ""}
                onInput={handleChange}
                className="w-full bg-[#91BFBF] border-0 rounded-lg px-4 
                py-2 focus:outline-none focus:ring-2
                 focus:ring-cyan-500 transition-all text-white placeholder-[#FFFFFF] bg-opacity-75"
                 placeholder="Birth Date"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <textarea
                name="bio"
                value={profile.bio || ""}
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
        <div className="relative w-[400px] h-[600px] -top-8 shrink-0">
          <div 
            className="w-full h-full rounded-3xl overflow-hidden shadow-xl bg-cover bg-center bg-no-repeat p-6 flex flex-col items-center"
            style={{ backgroundImage: "url('/images/setting-assests/bg-card.png')" }}
          >
            <div className="relative pt-[80px] z-10">
              <div className="mt-7 w-44 h-44 ml-9 rounded-full ring-4 ring-[#08BECE] shadow-lg overflow-hidden grid place-items-center">
                <img
                  src={profileData?.avatar || ""}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-6 w-[260px] h-[130px] rounded-xl p-2 bg-[#91BFBF] backdrop-blur-sm border-4 border-[#08BECE] text-white text-left z-10 relative">
                <p className="font-medium mb-1">{profileData?.name || "User Name"}</p>
                <p className="text-white/80 text-sm mb-1">{profileData?.birthday || "—"}</p>
                <p className="text-white/70 text-xs mb-1">{profileData?.email || "—"}</p>
                <p className="text-white/70 text-xs">{profileData?.location || "—"}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};


