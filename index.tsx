import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Not named App.tsx: Vite's dev server would resolve the /app route to that file on case-insensitive filesystems.
import App from './AppRoot';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
