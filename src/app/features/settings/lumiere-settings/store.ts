import { useEffect, useState } from 'react';

const LUMIERE_SETTINGS_KEY = 'lumiere_settings';
const LUMIERE_SETTINGS_CHANGE_EVENT = 'lumiere-settings-change';

type LumiereSettingsStore = {
  alternativeSidebar: boolean;
};

const defaultLumiereSettings: LumiereSettingsStore = {
  alternativeSidebar: true,
};

export const getLumiereSettings = (): LumiereSettingsStore => {
  const settingsRaw = localStorage.getItem(LUMIERE_SETTINGS_KEY);
  if (!settingsRaw) return defaultLumiereSettings;

  try {
    return {
      ...defaultLumiereSettings,
      ...(JSON.parse(settingsRaw) as Partial<LumiereSettingsStore>),
    };
  } catch {
    return defaultLumiereSettings;
  }
};

const setLumiereSettings = (settings: LumiereSettingsStore) => {
  localStorage.setItem(LUMIERE_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event(LUMIERE_SETTINGS_CHANGE_EVENT));
};

export const useAlternativeSidebarSetting = (): [boolean, (value: boolean) => void] => {
  const [alternativeSidebar, setAlternativeSidebar] = useState<boolean>(
    () => getLumiereSettings().alternativeSidebar
  );

  useEffect(() => {
    const syncSettings = () => {
      setAlternativeSidebar(getLumiereSettings().alternativeSidebar);
    };

    window.addEventListener('storage', syncSettings);
    window.addEventListener(LUMIERE_SETTINGS_CHANGE_EVENT, syncSettings);

    return () => {
      window.removeEventListener('storage', syncSettings);
      window.removeEventListener(LUMIERE_SETTINGS_CHANGE_EVENT, syncSettings);
    };
  }, []);

  const updateAlternativeSidebar = (value: boolean) => {
    setAlternativeSidebar(value);
    setLumiereSettings({
      ...getLumiereSettings(),
      alternativeSidebar: value,
    });
  };

  return [alternativeSidebar, updateAlternativeSidebar];
};
