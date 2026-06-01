import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const theme = typeof window !== 'undefined' ? localStorage.getItem('maad_theme') : 'light';
if (theme === 'dark') document.documentElement.classList.add('dark');

window.addEventListener('error', (e) => {
  console.error('Global error caught:', e.error || e.message);
  document.getElementById('root').innerHTML =
    `<div style="padding:20px;font-family:sans-serif;"><h2 style="color:red;">Error</h2><pre style="background:#f5f5f5;padding:12px;border-radius:8px;overflow:auto;font-size:13px;">${(e.error?.stack || e.error?.message || e.message || 'Unknown error')}</pre></div>`;
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
