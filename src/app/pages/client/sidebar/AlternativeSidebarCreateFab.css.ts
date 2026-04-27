import { style } from '@vanilla-extract/css';
import { toRem } from 'folds';

export const FabSidebarItem = style({
  selectors: {
    '&::before, &:hover::before': {
      display: 'none',
    },
    '&:hover': {
      transform: 'none',
    },
  },
});

export const FabSidebarAvatar = style({
  width: toRem(48),
  height: toRem(48),
  borderRadius: '9999px',
});

export const FabContainer = style({
  position: 'absolute',
  right: `calc(${toRem(12)} + env(safe-area-inset-right, 0px))`,
  bottom: `calc(${toRem(12)} + env(safe-area-inset-bottom, 0px))`,
  zIndex: 2,
});

export const FabContainerMobile = style({
  right: `calc(${toRem(24)} + env(safe-area-inset-right, 0px))`,
  bottom: `calc(${toRem(24)} + env(safe-area-inset-bottom, 0px))`,
});
