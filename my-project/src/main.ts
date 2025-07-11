import './style.css';
// import { renderWeclome } from './renderWeclome';
import { renderlogin } from './renderlogin';

import { renderSignup } from './renderSignup';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<div id="root"></div>`;

const root = document.getElementById('root');
if (root) {
  renderlogin(root);
}

// Expose globally for onclick inline use
(window as any).renderlogin = renderlogin;
(window as any).renderSignup = renderSignup;
