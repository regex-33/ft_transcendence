import './assets/styles/main.css';
import { App } from './core/App';
import { Component } from './core/Component';

const online_tracker = () => {
  const ws = new WebSocket('ws://localhost:8001/api/users/online-tracker');
  ws.onopen = () => {
    // ws.send(JSON.stringify({ token: localStorage.getItem('token') }));
  };

};

document.addEventListener('DOMContentLoaded', async () => {
  online_tracker();
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

