import './assets/styles/main.css';

const ws = new WebSocket(`${import.meta.env.VITE_WS_CHAT_SERVICE_HOST}/api/users/online-tracker`);

if (!(window as any).__APP_INITIALIZED__) {
  (window as any).__APP_INITIALIZED__ = true;

  let appInstance: any = null;

  const initializeApp = async () => {
    if (appInstance) {
      console.warn('App already initialized, skipping duplicate initialization');
      return;
    }

    try {
      console.log('Initializing application...');
      
      // avoid initialization timing issues
      const { App } = await import('./core/App');
      
      appInstance = new App({
        containerId: 'app',
        enableDevTools: true,
        enablePerformanceMonitoring: true
      });
      
      await appInstance.start();
      console.log('Application initialization complete');
      
    } catch (error) {
      console.error('Failed to start application:', error);
      appInstance = null;
      (window as any).__APP_INITIALIZED__ = false;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', async () => {
    if (appInstance) {
      console.log('Cleaning up application on page unload');
      await appInstance.stop();
      appInstance = null;
      (window as any).__APP_INITIALIZED__ = false;
    }
  });
}

export { ws };