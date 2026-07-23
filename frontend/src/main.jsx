import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './features/auth/AuthContext';
import { ThemeModeProvider } from './contexts/ThemeModeContext';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeModeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeModeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
