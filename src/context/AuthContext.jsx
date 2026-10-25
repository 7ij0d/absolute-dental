import React, { createContext, useState, useEffect, useContext } from 'react';
import supabase from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load and subscribe to session updates
  useEffect(() => {
    let active = true;

    const fetchSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && active) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);

          // If the URL has an OAuth token fragment (#access_token=...), clean it up and restore HashRouter route
          if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token=')) {
            const savedReturn = sessionStorage.getItem('ad_auth_return_url') || '/';
            sessionStorage.removeItem('ad_auth_return_url');
            const cleanHash = savedReturn.startsWith('/') ? `#${savedReturn}` : `#/${savedReturn}`;
            window.location.hash = cleanHash;
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Session fetch failed', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);

        // If the URL has an OAuth token fragment (#access_token=...), clean it up and restore HashRouter route
        if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token=')) {
          const savedReturn = sessionStorage.getItem('ad_auth_return_url') || '/';
          sessionStorage.removeItem('ad_auth_return_url');
          const cleanHash = savedReturn.startsWith('/') ? `#${savedReturn}` : `#/${savedReturn}`;
          window.location.hash = cleanHash;
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch full student details from profile table
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        if (data.status === 'disabled') {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          localStorage.removeItem('mock_user_session');
          alert('تم تعطيل حسابك من قبل الإدارة. / Your account has been disabled by the admin.');
        } else {
          setProfile(data);
        }
      } else if (error) {
        console.warn('Profile fetch error', error);
      }
    } catch (err) {
      console.error('Error fetching user profile', err);
    }
  };

  // Sign up a new student account
  const signUp = async (email, password, metadata) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata // Contains full_name, phone, university, etc.
        }
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Sign in standard user or admin
  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async (redirectPath = '/') => {
    setLoading(true);
    try {
      const origin = window.location.origin;
      // Extract Vite base URL (e.g. '/absolute-dental/' on GitHub Pages)
      const rawBase = (import.meta.env.BASE_URL || '/').replace(/^\/+|\/+$/g, '');
      const subpath = rawBase ? `/${rawBase}` : '';

      // Save user target destination to sessionStorage
      const safeRedirect = redirectPath && redirectPath.startsWith('/') ? redirectPath : `/${redirectPath || ''}`;
      try {
        sessionStorage.setItem('ad_auth_return_url', safeRedirect);
      } catch (e) {
        console.warn('Could not store return url in sessionStorage', e);
      }

      // Root application URL where Google redirects back (e.g. https://7ij0d.github.io/absolute-dental/)
      const finalRedirect = `${origin}${subpath}/`.replace(/([^:]\/)\/+/g, '$1');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: finalRedirect
        }
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      setLoading(false);
      return { data: null, error: err };
    }
  };

  // Sign out session
  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Sign out error', err);
    } finally {
      setLoading(false);
    }
  };

  // Update profile metrics (e.g. name, university, college)
  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user authenticated' };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (!error) {
        // Refresh local profile
        setProfile((prev) => ({ ...prev, ...updates }));
      }
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateProfile,
        refreshProfile: () => user && fetchUserProfile(user.id)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
