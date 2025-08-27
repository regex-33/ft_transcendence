// types/profile.ts
export interface UserProfile {
    id?: string;
    name: string;
    email: string;
    bio: string;
    birthday: string;
    location: string;
    avatar?: string;
  }
  
  // store/profileStore.ts
  import { useState } from '../../hooks/useState';
  import { useEffect } from '../../hooks/useEffect';
  
  // Global state
  let globalProfileState: UserProfile = {
    name: '',
    email: '',
    bio: '',
    birthday: '',
    location: ''
  };
  
  let subscribers: Array<() => void> = [];
  
  // Global state manager
  export const ProfileStore = {
    // Get current state
    getState: (): UserProfile => globalProfileState,
    
    // Update state and notify subscribers
    setState: (newState: Partial<UserProfile>) => {
      globalProfileState = { ...globalProfileState, ...newState };
      subscribers.forEach(callback => callback());
    },
    
    // Subscribe to state changes
    subscribe: (callback: () => void) => {
      subscribers.push(callback);
      return () => {
        subscribers = subscribers.filter(sub => sub !== callback);
      };
    },
    
    // API calls
    updateProfile: async (profileData: Partial<UserProfile>): Promise<boolean> => {
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData)
        });
        
        if (response.status === 200) {
          const updatedProfile = await response.json();
          ProfileStore.setState(updatedProfile);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to update profile:', error);
        return false;
      }
    },
    
    // Load initial profile data
    loadProfile: async (): Promise<void> => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const profile = await response.json();
          ProfileStore.setState(profile);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    }
  };
  
  // Custom hook to use profile state
  export const useProfileState = (): [UserProfile, (newState: Partial<UserProfile>) => void] => {
    const [profile, setProfile] = useState<UserProfile>(ProfileStore.getState());
    
    useEffect(() => {
      const unsubscribe = ProfileStore.subscribe(() => {
        setProfile(ProfileStore.getState());
      });
      
      return unsubscribe;
    }, []);
    
    const updateProfile = (newState: Partial<UserProfile>) => {
      ProfileStore.setState(newState);
    };
    
    return [profile, updateProfile];
  };