import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import supabase from './supabaseClient';

// Global contexts
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

/**
 * Intercept Google OAuth access tokens / PKCE code before HashRouter mounts.
 * HashRouter would otherwise interpret #access_token=... as an invalid page route,
 * breaking URL parsing and leaving the screen blank.
 */
const handleEarlyOAuthTokens = async () => {
  if (typeof window === 'undefined') return;

  try {
    const rawHash = window.location.hash || '';
    const rawSearch = window.location.search || '';

    const hasHashTokens = rawHash.includes('access_token=') || rawHash.includes('error=');
    const hasCode = rawSearch.includes('code=') || rawHash.includes('code=');

    if (!hasHashTokens && !hasCode) {
      return;
    }

    // Strip leading '#/', '#', or '?'
    const cleanHash = rawHash.replace(/^#\/?/, '');
    const cleanSearch = rawSearch.replace(/^\?/, '');

    const hashParams = new URLSearchParams(cleanHash);
    const searchParams = new URLSearchParams(cleanSearch);

    const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
    const code = searchParams.get('code') || hashParams.get('code');
    const error = hashParams.get('error') || searchParams.get('error');

    if (error) {
      console.warn('Google OAuth returned error:', error);
    }

    // Retrieve intended return path or fallback to home
    let returnPath = '/';
    try {
      const saved = sessionStorage.getItem('ad_auth_return_url');
      if (saved) {
        returnPath = saved.startsWith('/') ? saved : `/${saved}`;
        sessionStorage.removeItem('ad_auth_return_url');
      }
    } catch (e) {
      // Ignore sessionStorage errors
    }

    const cleanHashTarget = returnPath.startsWith('/') ? `#${returnPath}` : `#/${returnPath}`;

    // Establish session in client storage
    if (accessToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      });
    } else if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    }

    // Clean hash and query string in browser bar before HashRouter evaluates
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + cleanHashTarget);
    } else {
      window.location.hash = cleanHashTarget;
    }
  } catch (err) {
    console.error('OAuth token handling error:', err);
  }
};

const renderApp = () => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <HashRouter>
          <LanguageProvider>
            <ThemeProvider>
              <CartProvider>
                <AuthProvider>
                  <App />
                </AuthProvider>
              </CartProvider>
            </ThemeProvider>
          </LanguageProvider>
        </HashRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

// Execute pre-router token handling, then mount the app
handleEarlyOAuthTokens().finally(() => {
  renderApp();
});

