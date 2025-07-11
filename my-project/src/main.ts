import './style.css';
// import { renderWeclome } from './renderWeclome';
import { renderSing } from './renderSing';
// import { showLogin, showRegister } from './auth';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<div id="root"></div>`;

const root = document.getElementById('root');
if (root) {
  renderSing(root);
}

// (window as any).showLogin = showLogin;
// (window as any).showRegister = showRegister;