import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const theme = typeof window !== 'undefined' ? localStorage.getItem('maad_theme') : 'light';
if (theme === 'dark') document.documentElement.classList.add('dark');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
