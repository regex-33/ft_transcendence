// Add this import at the top of your App.ts file
import { ProfilePage } from '../components/settings/ProfilePage';

// Add these routes in your setupRoutes() method after the existing routes:

// Profile routes - add these to your setupRoutes() method
this.router.addRoute('/profile/:username', (params) => 
  this.createFunctionalComponent(ProfilePage, { username: params.username })
);

// Keep the existing Profile route for backward compatibility
this.router.addRoute('/Profile', () => 
  this.createFunctionalComponent(SettingsPage, { defaultTab: 'overview' })
);