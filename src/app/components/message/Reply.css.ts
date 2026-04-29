import { style } from '@vanilla-extract/css';
import { config, toRem } from 'folds';
import { canHoverMediaQuery } from '../../styles/media';

export const ReplyBend = style({
  flexShrink: 0,
});

export const ThreadIndicator = style({
  opacity: config.opacity.P300,

  selectors: {
    'button&': {
      cursor: 'pointer',
    },
  },
  '@media': {
    [canHoverMediaQuery]: {
      selectors: {
        ':hover&': {
          opacity: config.opacity.P500,
        },
      },
    },
  },
});

export const Reply = style({
  marginBottom: toRem(1),
  minWidth: 0,
  maxWidth: '100%',
  minHeight: config.lineHeight.T300,
  selectors: {
    'button&': {
      cursor: 'pointer',
    },
  },
});

export const ReplyContent = style({
  opacity: config.opacity.P300,

  '@media': {
    [canHoverMediaQuery]: {
      selectors: {
        [`${Reply}:hover &`]: {
          opacity: config.opacity.P500,
        },
      },
    },
  },
});
