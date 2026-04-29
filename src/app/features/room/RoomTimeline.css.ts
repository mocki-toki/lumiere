import { style } from '@vanilla-extract/css';
import { RecipeVariants, recipe } from '@vanilla-extract/recipes';
import { DefaultReset, config, toRem } from 'folds';

export const TimelineFloat = recipe({
  base: [
    DefaultReset,
    {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1,
      minWidth: 'max-content',
    },
  ],
  variants: {
    position: {
      Top: {
        top: config.space.S400,
      },
      Bottom: {
        bottom: config.space.S400,
      },
    },
  },
  defaultVariants: {
    position: 'Top',
  },
});

export type TimelineFloatVariants = RecipeVariants<typeof TimelineFloat>;

export const BotActionRows = style({
  width: '100%',
});

export const BotActionRow = style({
  display: 'grid',
  width: 'max-content',
  maxWidth: '100%',
  gap: config.space.S200,
});

export const BotActionButton = style({
  boxSizing: 'border-box',
  width: 'auto',
  minHeight: toRem(44),
  paddingInline: config.space.S300,
  justifyContent: 'center',
  textAlign: 'center',
  '@media': {
    'screen and (min-width: 768px)': {
      minHeight: toRem(40),
      paddingInline: config.space.S200,
    },
  },
});
