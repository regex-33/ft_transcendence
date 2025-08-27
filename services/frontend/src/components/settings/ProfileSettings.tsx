import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';

export const ProfileSettings: ComponentFunction = () => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    aboutMe: '',
    birthday: '',
    location: ''
  });

  const [previewAvatar, setPreviewAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState('');

  // Fetch current profile data on component mount
  useEffect(() => {
    const fetchCurrentProfile = async () => {
      try {
        setIsFetching(true);
        
        const response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Update form with current data
          setFormData({
            name: data.name || '',
            email: data.email || '',
            aboutMe: data.aboutMe || '',
            birthday: data.birthday || '',
            location: data.location || ''
          });
          setPreviewAvatar(data.avatar || "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg");
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setMessage('Failed to load current profile data. Please refresh the page.');
        
        // Set default values on error
        setFormData({
          name: '',
          email: '',
          aboutMe: '',
          birthday: '',
          location: ''
        });
        setPreviewAvatar("https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg");
      } finally {
        setIsFetching(false);
      }
    };

    fetchCurrentProfile();
  }, []);

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle avatar change
  const handleAvatarChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAvatar = event.target?.result as string;
        setPreviewAvatar(newAvatar);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle save with API call
  const handleSave = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const profileData = {
        name: formData.name,
        email: formData.email,
        aboutMe: formData.aboutMe,
        birthday: formData.birthday,
        location: formData.location,
        avatar: previewAvatar
      };

      const response = await fetch('/api/profile', {
        method: 'POST', // or 'PUT' depending on your API design
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        setMessage('Profile updated successfully!');
        
        // Optional: Refresh the page after a short delay to show updated data in sidebar
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage(`Failed to update profile: ${error instanceof Error ? error.message : 'Please try again.'}`);
      
      // Clear error message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form to original values (refetch from API)
  const handleReset = async () => {
    setMessage('');
    
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        setFormData({
          name: data.name || '',
          email: data.email || '',
          aboutMe: data.aboutMe || '',
          birthday: data.birthday || '',
          location: data.location || ''
        });
        setPreviewAvatar(data.avatar || "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg");
        
        setMessage('Form reset to current saved values.');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      console.error('Error resetting form:', error);
      setMessage('Failed to reset form. Please refresh the page.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Show loading state while fetching initial data
  if (isFetching) {
    return (
      <div className="h-[700px] max-w-[1400px] bg-[#91BFBF] bg-opacity-85 mr-auto mt-12 rounded-xl p-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-luckiest text-white mb-8">Edit Profile</h2>
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-xl">Loading profile data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[700px] max-w-[1400px] bg-[#91BFBF] bg-opacity-85 mr-auto mt-12 rounded-xl p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-luckiest text-white mb-8">Edit Profile</h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-[120px] h-[120px] mb-4">
              <img
                src="/images/home-assests/cir-online.svg"
                className="absolute inset-0 w-full h-full z-0"
                alt="Online circle"
              />
              <img
                src={previewAvatar}
                className="absolute inset-[12px] w-24 h-24 rounded-full object-cover z-10"
                alt="Avatar"
                onError={(e: { target: HTMLImageElement; }) => {
                  (e.target as HTMLImageElement).src = "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg";
                }}
              />
            </div>
            <label className="bg-[#6EC2B4] text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-[#5BB3A5] transition">
              <span>Change Avatar</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-semibold mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e: Event) => handleInputChange('name', (e.target as HTMLInputElement).value)}
                className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 border border-white/30 focus:border-[#6EC2B4] focus:outline-none"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e: Event) => handleInputChange('email', (e.target as HTMLInputElement).value)}
                className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 border border-white/30 focus:border-[#6EC2B4] focus:outline-none"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Birthday</label>
              <input
                type="text"
                value={formData.birthday}
                onChange={(e: Event) => handleInputChange('birthday', (e.target as HTMLInputElement).value)}
                className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 border border-white/30 focus:border-[#6EC2B4] focus:outline-none"
                placeholder="DD/MM/YYYY"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e: Event) => handleInputChange('location', (e.target as HTMLInputElement).value)}
                className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 border border-white/30 focus:border-[#6EC2B4] focus:outline-none"
                placeholder="Enter your location"
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">About Me</label>
            <textarea
              value={formData.aboutMe}
              onChange={(e: Event) => handleInputChange('aboutMe', (e.target as HTMLTextAreaElement).value)}
              rows={4}
              className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 border border-white/30 focus:border-[#6EC2B4] focus:outline-none resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#6EC2B4] text-white px-8 py-3 rounded-lg hover:bg-[#5BB3A5] transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="bg-[#858895] text-white px-8 py-3 rounded-lg hover:bg-[#74798A] transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`text-center p-3 rounded-lg ${
              message.includes('success') || message.includes('reset')
                ? 'bg-green-500/20 text-green-200' 
                : 'bg-red-500/20 text-red-200'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
