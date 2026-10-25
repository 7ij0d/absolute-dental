import React, { createContext, useState, useEffect, useContext } from 'react';
import supabase from '../supabaseClient';

const AuthContext = createContext();

const getInitialUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cachedUser = localStorage.getItem('ad_cached_user');
    if (cachedUser) return JSON.parse(cachedUser);

    const rawSession = localStorage.getItem('ad_auth_session') ||
                       localStorage.getItem('sb-api-auth-token') ||
                       localStorage.getItem('ad_cached_session');
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      if (parsed?.user) return parsed.user;
    }
  } catch (_) {}
  return null;
};

const getInitialProfile = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem('ad_cached_profile');
    if (cached) return JSON.parse(cached);
  } catch (_) {}
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser);
  const [profile, setProfile] = useState(getInitialProfile);
  const [loading, setLoading] = useState(() => !getInitialUser());
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);

  // Sync cache whenever user or profile is updated
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem('ad_cached_user', JSON.stringify(user));
      } catch (_) {}
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      try {
        localStorage.setItem('ad_cached_profile', JSON.stringify(profile));
      } catch (_) {}
    }
  }, [profile]);

  // Check if student profile needs completion (name, whatsapp, etc.)
  const checkProfileCompleteness = (loadedProfile, currentUser) => {
    if (!currentUser || currentUser.email === 'admin@smylodent.com') return;
    const meta = currentUser.user_metadata || {};
    const hasPhone = Boolean(
      (loadedProfile?.phone && String(loadedProfile.phone).trim()) ||
      (meta.phone && String(meta.phone).trim())
    );
    if (!hasPhone) {
      setShowProfileCompletion(true);
    }
  };

  // Load and subscribe to session updates
  useEffect(() => {
    let active = true;

    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && active) {
          setUser(session.user);
          try {
            localStorage.setItem('ad_cached_user', JSON.stringify(session.user));
            localStorage.setItem('ad_cached_session', JSON.stringify(session));
          } catch (_) {}
          const p = await fetchUserProfile(session.user.id, session.user);
          checkProfileCompleteness(p, session.user);

          // If the URL has an OAuth token fragment (#access_token=...), clean it up and restore HashRouter route
          if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token=')) {
            const savedReturn = sessionStorage.getItem('ad_auth_return_url') || '/';
            sessionStorage.removeItem('ad_auth_return_url');
            const cleanHash = savedReturn.startsWith('/') ? `#${savedReturn}` : `#/${savedReturn}`;
            window.location.hash = cleanHash;
          }
        } else if (!session && active) {
          // Only wipe user if there is no cached user in localStorage
          const hasCache = localStorage.getItem('ad_auth_session') || localStorage.getItem('ad_cached_user');
          if (!hasCache) {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        console.warn('Session fetch notice:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;

      // ONLY sign out if explicitly requested
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        try {
          localStorage.removeItem('ad_cached_user');
          localStorage.removeItem('ad_cached_profile');
          localStorage.removeItem('ad_cached_session');
          localStorage.removeItem('ad_auth_session');
          localStorage.removeItem('sb-api-auth-token');
          localStorage.removeItem('mock_user_session');
        } catch (_) {}
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        try {
          localStorage.setItem('ad_cached_user', JSON.stringify(session.user));
          localStorage.setItem('ad_cached_session', JSON.stringify(session));
        } catch (_) {}
        const p = await fetchUserProfile(session.user.id, session.user);
        checkProfileCompleteness(p, session.user);

        // If the URL has an OAuth token fragment (#access_token=...), clean it up and restore HashRouter route
        if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token=')) {
          const savedReturn = sessionStorage.getItem('ad_auth_return_url') || '/';
          sessionStorage.removeItem('ad_auth_return_url');
          const cleanHash = savedReturn.startsWith('/') ? `#${savedReturn}` : `#/${savedReturn}`;
          window.location.hash = cleanHash;
        }
      } else if (!session && event === 'USER_DELETED') {
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
  const fetchUserProfile = async (userId, currentUser = null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (data) {
        if (data.status === 'disabled') {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          try {
            localStorage.removeItem('ad_cached_user');
            localStorage.removeItem('ad_cached_profile');
            localStorage.removeItem('ad_cached_session');
            localStorage.removeItem('ad_auth_session');
          } catch (_) {}
          alert('تم تعطيل حسابك من قبل الإدارة. / Your account has been disabled by the admin.');
          return null;
        } else {
          setProfile(data);
          try {
            localStorage.setItem('ad_cached_profile', JSON.stringify(data));
          } catch (_) {}
          return data;
        }
      } else {
        // Fallback: construct profile from user metadata if no profile row exists yet
        const meta = currentUser?.user_metadata || {};
        const fallbackProfile = {
          id: userId,
          email: currentUser?.email,
          full_name: meta.full_name || meta.name || '',
          phone: meta.phone || '',
          phone_secondary: meta.phone_secondary || '',
          university: meta.university || 'جامعة طرابلس',
          college: meta.college || 'كلية طب الأسنان',
          username: meta.username || '',
          academic_year: meta.academic_year || '2nd-year',
          status: 'active',
          role: meta.role || 'student'
        };
        setProfile(fallbackProfile);
        try {
          localStorage.setItem('ad_cached_profile', JSON.stringify(fallbackProfile));
        } catch (_) {}
        return fallbackProfile;
      }
    } catch (err) {
      console.warn('Notice fetching user profile:', err);
      return null;
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

      if (data?.user) {
        setUser(data.user);
        try {
          localStorage.setItem('ad_cached_user', JSON.stringify(data.user));
          if (data.session) {
            localStorage.setItem('ad_cached_session', JSON.stringify(data.session));
            localStorage.setItem('ad_auth_session', JSON.stringify(data.session));
          }
        } catch (_) {}

        // Automatically upsert student profile row into database
        const profilePayload = {
          id: data.user.id,
          email: email,
          full_name: metadata?.full_name || '',
          phone: metadata?.phone || '',
          phone_secondary: metadata?.phone_secondary || '',
          university: metadata?.university || 'جامعة طرابلس',
          college: metadata?.college || 'كلية طب الأسنان',
          status: 'active',
          role: 'student'
        };

        try {
          const { data: createdProfile } = await supabase
            .from('profiles')
            .upsert(profilePayload)
            .select()
            .maybeSingle();
          const finalProfile = createdProfile || profilePayload;
          setProfile(finalProfile);
          try {
            localStorage.setItem('ad_cached_profile', JSON.stringify(finalProfile));
          } catch (_) {}
        } catch (profErr) {
          console.warn('Profile upsert notice:', profErr);
          setProfile(profilePayload);
        }
      }

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

      if (data?.user) {
        setUser(data.user);
        try {
          localStorage.setItem('ad_cached_user', JSON.stringify(data.user));
          if (data.session) {
            localStorage.setItem('ad_cached_session', JSON.stringify(data.session));
            localStorage.setItem('ad_auth_session', JSON.stringify(data.session));
          }
        } catch (_) {}

        const p = await fetchUserProfile(data.user.id, data.user);
        if (p) {
          setProfile(p);
          try {
            localStorage.setItem('ad_cached_profile', JSON.stringify(p));
          } catch (_) {}
        }
        checkProfileCompleteness(p, data.user);
      }

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
    } catch (err) {
      console.warn('Sign out notice:', err);
    } finally {
      setUser(null);
      setProfile(null);
      try {
        localStorage.removeItem('ad_cached_user');
        localStorage.removeItem('ad_cached_profile');
        localStorage.removeItem('ad_cached_session');
        localStorage.removeItem('ad_auth_session');
        localStorage.removeItem('sb-api-auth-token');
        localStorage.removeItem('mock_user_session');
        sessionStorage.removeItem('admin_pin');
        localStorage.removeItem('admin_pin');
        localStorage.removeItem('admin_passcode');
      } catch (_) {}
      setLoading(false);
    }
  };

  // Update profile metrics (e.g. name, university, college, avatar, username, privacy)
  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user authenticated' };
    try {
      const payload = {
        id: user.id,
        email: user.email,
        ...updates
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload)
        .select()
        .maybeSingle();
      
      if (!error) {
        // Also update auth user metadata for immediate cross-session persistence
        try {
          const authData = {};
          if (updates.full_name) authData.full_name = updates.full_name;
          if (updates.name) authData.name = updates.name;
          if (updates.username) authData.username = updates.username;
          if (updates.avatar_url) authData.avatar_url = updates.avatar_url;
          if (updates.phone) authData.phone = updates.phone;
          if (updates.university) authData.university = updates.university;
          if (updates.college) authData.college = updates.college;
          if (updates.academic_year) authData.academic_year = updates.academic_year;
          if (updates.is_anonymous_default !== undefined) authData.is_anonymous_default = updates.is_anonymous_default;
          if (Object.keys(authData).length > 0) {
            await supabase.auth.updateUser({ data: authData });
          }
        } catch (metaErr) {
          console.warn('Metadata sync warning:', metaErr);
        }

        // Refresh local profile
        setProfile((prev) => ({ ...(prev || {}), ...payload, ...(data || {}) }));
      }
      return { data: data || payload, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        setProfile,
        loading,
        showProfileCompletion,
        setShowProfileCompletion,
        openProfileCompletion: () => setShowProfileCompletion(true),
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
