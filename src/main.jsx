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
      console.warn('OAuth returned notice/error:', error);
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

    // Establish session in client storage & immediate cache
    if (code) {
      try {
        const { data } = await supabase.auth.exchangeCodeForSession(code);
        if (data?.session?.user) {
          localStorage.setItem('ad_cached_user', JSON.stringify(data.session.user));
          localStorage.setItem('ad_cached_session', JSON.stringify(data.session));
        }
      } catch (exchangeErr) {
        console.warn('Code exchange handled or caught:', exchangeErr);
      }
    } else if (accessToken) {
      if (refreshToken) {
        try {
          const { data } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (data?.session?.user) {
            localStorage.setItem('ad_cached_user', JSON.stringify(data.session.user));
            localStorage.setItem('ad_cached_session', JSON.stringify(data.session));
          }
        } catch (setErr) {
          console.warn('setSession notice:', setErr);
        }
      } else {
        // If implicit token without explicit refresh token
        try {
          const { data: { user } } = await supabase.auth.getUser(accessToken);
          if (user) {
            const expiresIn = parseInt(hashParams.get('expires_in') || '3600', 10);
            const synthSession = {
              access_token: accessToken,
              refresh_token: '',
              expires_in: expiresIn,
              expires_at: Math.floor(Date.now() / 1000) + expiresIn,
              token_type: 'bearer',
              user: user
            };
            localStorage.setItem('ad_cached_user', JSON.stringify(user));
            localStorage.setItem('ad_cached_session', JSON.stringify(synthSession));
            localStorage.setItem('ad_auth_session', JSON.stringify(synthSession));
          }
        } catch (getErr) {
          console.warn('getUser notice:', getErr);
        }
      }
    }

    // Clean hash and query string in browser bar before HashRouter evaluates
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + cleanHashTarget);
    } else {
      window.location.hash = cleanHashTarget;
    }
  } catch (err) {
    console.error('OAuth token handling notice:', err);
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

