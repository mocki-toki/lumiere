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
});
