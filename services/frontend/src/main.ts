import './assets/styles/main.css';
import { App } from './core/App';
import { Component } from './core/Component';

const ws = new WebSocket(`ws://${window.location.host}/api/users/online-tracker`);
// const ws = new WebSocket(`${import.meta.env.WS_PROTOCOL}://${window.location.host}/api/users/online-tracker`);

document.addEventListener('DOMContentLoaded', async () => {
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

export { Component, ws };
