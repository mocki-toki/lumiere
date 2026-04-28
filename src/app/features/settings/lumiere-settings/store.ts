import { useEffect, useState } from 'react';

const LUMIERE_SETTINGS_KEY = 'lumiere_settings';
const LUMIERE_SETTINGS_CHANGE_EVENT = 'lumiere-settings-change';

type LumiereSettingsStore = {
  alternativeSidebar: boolean;
  showLastMessage: boolean;
  compactChats: boolean;
  roundAvatars: boolean;
};

const defaultLumiereSettings: LumiereSettingsStore = {
  alternativeSidebar: true,
  showLastMessage: true,
  compactChats: false,
  roundAvatars: true,
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

export const useShowLastMessageSetting = (): [boolean, (value: boolean) => void] => {
  const [showLastMessage, setShowLastMessage] = useState<boolean>(
    () => getLumiereSettings().showLastMessage
  );

  useEffect(() => {
    const syncSettings = () => {
      setShowLastMessage(getLumiereSettings().showLastMessage);
    };

    window.addEventListener('storage', syncSettings);
    window.addEventListener(LUMIERE_SETTINGS_CHANGE_EVENT, syncSettings);

    return () => {
      window.removeEventListener('storage', syncSettings);
      window.removeEventListener(LUMIERE_SETTINGS_CHANGE_EVENT, syncSettings);
    };
  }, []);

  const updateShowLastMessage = (value: boolean) => {
    setShowLastMessage(value);
    setLumiereSettings({
      ...getLumiereSettings(),
      showLastMessage: value,
    });
  };

  return [showLastMessage, updateShowLastMessage];
};

export const useCompactChatsSetting = (): [boolean, (value: boolean) => void] => {
  const [compactChats, setCompactChats] = useState<boolean>(
    () => getLumiereSettings().compactChats
  );

  useEffect(() => {
    const syncSettings = () => {
      setCompactChats(getLumiereSettings().compactChats);
    };

    window.addEventListener('storage', syncSettings);
    window.addEventListener(LUMIERE_SETTINGS_CHANGE_EVENT, syncSettings);

    return () => {
      window.removeEventListener('storage', syncSettings);
      window.removeEventListener(LUMIERE_SETTINGS_CHANGE_EVENT, syncSettings);
    };
  }, []);

  const updateCompactChats = (value: boolean) => {
    setCompactChats(value);
    setLumiereSettings({
      ...getLumiereSettings(),
      compactChats: value,
    });
  };

  return [compactChats, updateCompactChats];
};

export const useRoundAvatarsSetting = (): [boolean, (value: boolean) => void] => {
  const [roundAvatars, setRoundAvatars] = useState<boolean>(
    () => getLumiereSettings().roundAvatars
  );

  useEffect(() => {
    const syncSettings = () => {
      setRoundAvatars(getLumiereSettings().roundAvatars);
    };

    window.addEventListener('storage', syncSettings);
    window.addEventListener(LUMIERE_SETTINGS_CHANGE_EVENT, syncSettings);

    return () => {
      window.removeEventListener('storage', syncSettings);
      window.removeEventListener(LUMIERE_SETTINGS_CHANGE_EVENT, syncSettings);
    };
  }, []);

  const updateRoundAvatars = (value: boolean) => {
    setRoundAvatars(value);
    setLumiereSettings({
      ...getLumiereSettings(),
      roundAvatars: value,
    });
  };

  return [roundAvatars, updateRoundAvatars];
};
