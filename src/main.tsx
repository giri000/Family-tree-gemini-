import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { M3ThemeProvider } from './components/M3ThemeProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <M3ThemeProvider>
      <App />
    </M3ThemeProvider>
  </StrictMode>,
);

