import { useState, useEffect } from 'react';
import supabase from '../supabaseClient';

let memoryConfig = null;
let inFlightConfigPromise = null;
const subscribers = new Set();

function getInitialConfig() {
  if (memoryConfig) return memoryConfig;
  try {
    const cached = localStorage.getItem('ad_site_sections_config');
    if (cached) {
      memoryConfig = JSON.parse(cached);
      return memoryConfig;
    }
  } catch (_) {}
  return {};
}

export function invalidateSiteSectionsConfigCache(nextValue) {
  if (nextValue) {
    memoryConfig = nextValue;
    try {
      localStorage.setItem('ad_site_sections_config', JSON.stringify(nextValue));
    } catch (_) {}
    subscribers.forEach((cb) => cb(nextValue));
  } else {
    memoryConfig = null;
    inFlightConfigPromise = null;
  }
}

export const useSiteSectionsConfig = () => {
  const [config, setConfig] = useState(getInitialConfig);

  useEffect(() => {
    let mounted = true;
    const handleUpdate = (val) => {
      if (mounted) setConfig(val);
    };
    subscribers.add(handleUpdate);

    if (!inFlightConfigPromise) {
      inFlightConfigPromise = supabase
        .from('settings')
        .select('value')
        .eq('key', 'site_sections_config')
        .maybeSingle()
        .then(({ data }) => {
          if (data?.value) {
            memoryConfig = data.value;
            try {
              localStorage.setItem('ad_site_sections_config', JSON.stringify(data.value));
            } catch (_) {}
            subscribers.forEach((cb) => cb(data.value));
          }
          return memoryConfig || {};
        })
        .catch(() => memoryConfig || {});
    } else if (memoryConfig) {
      setConfig(memoryConfig);
    }

    return () => {
      mounted = false;
      subscribers.delete(handleUpdate);
    };
  }, []);

  return config || {};
};
