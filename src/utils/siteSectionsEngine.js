import { useState, useEffect } from 'react';
import supabase from '../supabaseClient';

export const useSiteSectionsConfig = () => {
  const [config, setConfig] = useState(() => {
    try {
      const cached = localStorage.getItem('ad_site_sections_config');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return {};
  });

  useEffect(() => {
    let mounted = true;
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'site_sections_config')
      .maybeSingle()
      .then(({ data }) => {
        if (mounted && data?.value) {
          setConfig(data.value);
          try {
            localStorage.setItem('ad_site_sections_config', JSON.stringify(data.value));
          } catch (_) {}
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  return config || {};
};
