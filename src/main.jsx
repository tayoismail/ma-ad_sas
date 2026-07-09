import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const theme = typeof window !== 'undefined' ? localStorage.getItem('maad_theme') : 'light';
if (theme === 'dark') document.documentElement.classList.add('dark');

const isDark = document.documentElement.classList.contains('dark');
const errorHTML = (title, message, detail) => `
<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;background:${isDark ? '#0f172a' : '#f1f5f9'};font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:420px;width:100%;background:${isDark ? '#1e293b' : '#ffffff'};border-radius:16px;padding:32px;box-shadow:0 20px 60px rgba(0,0,0,0.15);border:1px solid ${isDark ? '#334155' : '#e2e8f0'};text-align:center;">
    <div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,rgba(239,68,68,0.15),rgba(168,85,247,0.15));display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
    </div>
    <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;color:${isDark ? '#f1f5f9' : '#0f172a'};">${title}</h2>
    <p style="font-size:14px;margin:0 0 16px;color:${isDark ? '#94a3b8' : '#64748b'};line-height:1.5;">${message}</p>
    ${detail ? `<pre style="text-align:left;font-size:12px;background:${isDark ? '#0f172a' : '#f8fafc'};padding:12px;border-radius:8px;overflow:auto;max-height:100px;color:${isDark ? '#94a3b8' : '#64748b'};border:1px solid ${isDark ? '#334155' : '#e2e8f0'};word-break:break-all;">${detail}</pre>` : ''}
    <button onclick="window.location.reload()" style="margin-top:16px;padding:10px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">Retry</button>
  </div>
</div>`;

window.addEventListener('error', (e) => {
  console.error('Global error caught:', e.error || e.message);
  const isChunkError = /Loading chunk|dynamically imported module|import\(\) failed/i.test(e.message || e.error?.message || '');
  if (isChunkError) {
    document.getElementById('root').innerHTML = errorHTML(
      'Network Error',
      'Failed to load part of the application. Please check your internet connection.',
      ''
    );
    return;
  }
  document.getElementById('root').innerHTML = errorHTML(
    'Something went wrong',
    e.error?.message || e.message || 'An unexpected error occurred.',
    (e.error?.stack || '').split('\n').slice(0, 5).join('\n')
  );
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
  const isChunkError = /Loading chunk|dynamically imported module|import\(\) failed/i.test(e.reason?.message || '');
  if (isChunkError) {
    document.getElementById('root').innerHTML = errorHTML(
      'Network Error',
      'Failed to load part of the application. Please check your internet connection and try again.',
      ''
    );
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker for offline caching (static assets only)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
