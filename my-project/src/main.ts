import './style.css';
import { renderHome } from './renderHome';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<div id="root"></div>`;

const root = document.getElementById('root');
if (root) {
  renderHome(root);
}
