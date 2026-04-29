import { style } from '@vanilla-extract/css';
import { config, toRem } from 'folds';
import { canHoverMediaQuery } from '../../styles/media';

export const RoomItemCard = style({
  padding: config.space.S400,
  borderRadius: 0,
  position: 'relative',
  selectors: {
    '&[data-dragging=true]': {
      opacity: config.opacity.Disabled,
    },
  },
});
export const RoomProfileTopic = style({
  cursor: 'pointer',
  '@media': {
    [canHoverMediaQuery]: {
      ':hover': {
        textDecoration: 'underline',
      },
    },
  },
});
export const ErrorNameContainer = style({
  gap: toRem(2),
});
