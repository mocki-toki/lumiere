import { style } from '@vanilla-extract/css';
import { config } from 'folds';
import { canHoverMediaQuery } from '../../styles/media';

export const Header = style({
  borderBottomColor: 'transparent',
});
export const HeaderTopic = style({
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
