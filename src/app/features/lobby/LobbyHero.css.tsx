import { style } from '@vanilla-extract/css';
import { config } from 'folds';
import { canHoverMediaQuery } from '../../styles/media';

export const LobbyHeroTopic = style({
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  '@media': {
    [canHoverMediaQuery]: {
      ':hover': {
        cursor: 'pointer',
        opacity: config.opacity.P500,
        textDecoration: 'underline',
      },
    },
  },
});
