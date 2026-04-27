import { style } from '@vanilla-extract/css';

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
