import React, { ReactNode, useEffect } from 'react';
import { configClass, varsClass } from 'folds';
import {
  DarkTheme,
  LightTheme,
  ThemeContextProvider,
  ThemeKind,
  useActiveTheme,
  useSystemThemeKind,
} from '../hooks/useTheme';
import { useSetting } from '../state/hooks/settings';
import { settingsAtom } from '../state/settings';

const isTransparent = (color: string): boolean =>
  color === 'transparent' || color === 'rgba(0, 0, 0, 0)' || color === 'rgba(0,0,0,0)';

const getThemeColorFromLayout = (themeKind: ThemeKind): string => {
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  if (bodyBg && !isTransparent(bodyBg)) return bodyBg;

  const rootBg = getComputedStyle(document.documentElement).backgroundColor;
  if (rootBg && !isTransparent(rootBg)) return rootBg;

  return themeKind === ThemeKind.Dark ? '#1b1d22' : '#ffffff';
};

const setBrowserChromeTheme = (themeKind: ThemeKind) => {
  const isDark = themeKind === ThemeKind.Dark;
  const themeColor = getThemeColorFromLayout(themeKind);

  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', themeColor);
  });

  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

export function UnAuthRouteThemeManager() {
  const systemThemeKind = useSystemThemeKind();

  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(configClass, varsClass);
    if (systemThemeKind === ThemeKind.Dark) {
      document.body.classList.add(...DarkTheme.classNames);
    }
    if (systemThemeKind === ThemeKind.Light) {
      document.body.classList.add(...LightTheme.classNames);
    }

    setBrowserChromeTheme(systemThemeKind);
  }, [systemThemeKind]);

  return null;
}

export function AuthRouteThemeManager({ children }: { children: ReactNode }) {
  const activeTheme = useActiveTheme();
  const [monochromeMode] = useSetting(settingsAtom, 'monochromeMode');

  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(configClass, varsClass);

    document.body.classList.add(...activeTheme.classNames);

    if (monochromeMode) {
      document.body.style.filter = 'grayscale(1)';
    } else {
      document.body.style.filter = '';
    }

    setBrowserChromeTheme(activeTheme.kind);
  }, [activeTheme, monochromeMode]);

  return <ThemeContextProvider value={activeTheme}>{children}</ThemeContextProvider>;
}
