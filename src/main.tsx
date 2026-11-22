import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

async function boot() {
  // Preview build (GitHub Pages): answer /api calls in the browser instead of a server.
  if (import.meta.env.VITE_PREVIEW === 'true') {
    const {installPreviewApi} = await import('./previewApi');
    installPreviewApi();
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

boot();
