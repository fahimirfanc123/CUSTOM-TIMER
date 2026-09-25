import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { MiniWindowContainer } from './features/focus-timer/MiniWindowContainer';
import './app/app.css';

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const isMiniWindow =
  params?.get('window') === 'pomodoro-mini' ||
  (typeof window !== 'undefined' && window.location.hash === '#pomodoro-mini');

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      {isMiniWindow ? <MiniWindowContainer /> : <App />}
    </StrictMode>
  );
}
