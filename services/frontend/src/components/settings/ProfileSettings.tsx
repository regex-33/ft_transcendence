import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';

interface Profile {
  id: number;
  name: string;
  email: string;
  birthday: string;
  location:string;
  bio: string;
}

export const ProfileSettings: ComponentFunction = () => {
  const [profile, setProfile] = useState<Profile>({
    id: 1,
    name: "",
    email: "",
    birthday: "",
    location:"",
    bio: "",
  });
  const [initialProfile, setInitialProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile on mount
  useEffect(() => {
    fetch("https://profile.free.beeceptor.com")
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

  // ✅ Corrected: use standard DOM types instead of React
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    setProfile({ ...profile, [target.name]: target.value });
  };

  const handleSave = async () => {
    try {
      const res = await fetch("https://profile.free.beeceptor.com", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      alert("Profile saved!");
      const updated = await res.json();
      setProfile(updated);
      setInitialProfile(updated);
    } catch (err) {
      console.error(err);
      alert("Error saving profile");
    }
  };

  const handleReset = () => {
    if (initialProfile) setProfile(initialProfile);
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      <div className="mb-3">
        <label className="block font-semibold mb-1">Name</label>
        <input
          name="name"
          value={profile.name}
          onInput={handleChange} // ✅ use onInput instead of onChange in your VDOM
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
        />
      </div>
      <div className="mb-3">
        <label className="block font-semibold mb-1">Email</label>
        <input
          name="email"
          value={profile.email}
          onInput={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
        />
      </div>
      <div className="mb-3">
        <label className="block font-semibold mb-1">Birthday</label>
        <input
          name="birthday"
          type="date"
          value={profile.birthday}
          onInput={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Bio</label>
        <textarea
          name="bio"
          value={profile.bio}
          onInput={handleChange}
          rows={3}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
        />
      </div>
      <div className="flex justify-between">
        <button
          onClick={handleSave}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Save
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
};



