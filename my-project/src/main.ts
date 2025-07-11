import './style.css';
import { renderWeclome } from './renderWeclome';
// import { renderSing } from './renderSing';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<div id="root"></div>`;

const root = document.getElementById('root');
if (root) {
  renderWeclome(root);
}