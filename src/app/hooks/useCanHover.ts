import { useEffect, useState } from 'react';
import { canHoverMediaQuery } from '../styles/media';

const getCanHover = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(canHoverMediaQuery).matches;
};

export const useCanHover = (): boolean => {
  const [canHover, setCanHover] = useState<boolean>(() => getCanHover());

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia(canHoverMediaQuery);
    const onChange = (event: MediaQueryListEvent) => setCanHover(event.matches);

    setCanHover(media.matches);
    media.addEventListener('change', onChange);

    return () => {
      media.removeEventListener('change', onChange);
    };
  }, []);

  return canHover;
};
