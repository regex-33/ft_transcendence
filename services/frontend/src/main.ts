import './assets/styles/main.css';
import { App } from './core/App';
import { Component } from './core/Component';

document.addEventListener('DOMContentLoaded', async () => {
  new WebSocket('ws://localhost:8001/api/users/online-tracker');
  try {
    const app = new App({
      containerId: 'app',
      enableDevTools: true,
      enablePerformanceMonitoring: true
    });
    await app.start();
  } catch (error) {
    console.error('Failed to start application:', error);
  }
});

export { Component };

