import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { Box, ContainerColor, as, color } from 'folds';
import * as css from './layout.css';

type BubbleArrowProps = {
  variant: ContainerColor;
  className?: string;
};
function BubbleLeftArrow({ variant, className }: BubbleArrowProps) {
  return (
    <svg
      className={classNames(css.BubbleLeftArrow, className)}
      width="9"
      height="8"
      viewBox="0 0 9 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.00004 8V0H4.82847C3.04666 0 2.15433 2.15428 3.41426 3.41421L8.00004 8H9.00004Z"
        fill={color[variant].Container}
      />
    </svg>
  );
}

type BubbleLayoutProps = {
  hideBubble?: boolean;
  before?: ReactNode;
  header?: ReactNode;
  tail?: 'top' | 'bottom' | 'none';
  tailSide?: 'left' | 'right';
  contentClassName?: string;
  contentAlign?: 'start' | 'end';
  bubbleVariant?: ContainerColor;
  textVariant?: ContainerColor;
};

export const BubbleLayout = as<'div', BubbleLayoutProps>(
  (
    {
      hideBubble,
      before,
      header,
      tail = 'top',
      tailSide = 'left',
      contentClassName,
      contentAlign = 'start',
      bubbleVariant = 'SurfaceVariant',
      textVariant,
      children,
      ...props
    },
    ref
  ) => (
    <Box gap={before ? '300' : '0'} {...props} ref={ref}>
      <Box className={classNames(css.BubbleBefore, !before && css.BubbleBeforeHidden)} shrink="No">
        {before}
      </Box>
      <Box grow="Yes" direction="Column">
        {header}
        {hideBubble ? (
          children
        ) : (
          <Box justifyContent={contentAlign === 'end' ? 'End' : 'Start'}>
            <Box
              className={
                hideBubble
                  ? undefined
                  : classNames(
                      css.BubbleContent,
                      contentClassName,
                      tailSide === 'left' && tail === 'top' ? css.BubbleContentArrowLeftTop : undefined,
                      tailSide === 'left' && tail === 'bottom'
                        ? css.BubbleContentArrowLeftBottom
                        : undefined,
                      tailSide === 'right' && tail === 'top'
                        ? css.BubbleContentArrowRightTop
                        : undefined,
                      tailSide === 'right' && tail === 'bottom'
                        ? css.BubbleContentArrowRightBottom
                        : undefined
                    )
              }
              style={{
                backgroundColor: color[bubbleVariant].Container,
                color: color[textVariant ?? bubbleVariant].OnContainer,
              }}
              direction="Column"
            >
              {tail !== 'none' ? (
                <BubbleLeftArrow
                  variant={bubbleVariant}
                  className={classNames(
                    tailSide === 'right' ? css.BubbleRightArrow : undefined,
                    tailSide === 'right' && tail === 'bottom'
                      ? css.BubbleRightArrowBottom
                      : undefined,
                    tailSide === 'right' && tail === 'top' ? css.BubbleRightArrowTop : undefined,
                    tailSide === 'left' && tail === 'bottom' ? css.BubbleLeftArrowBottom : undefined,
                    tailSide === 'left' && tail === 'top' ? css.BubbleLeftArrowTop : undefined
                  )}
                />
              ) : null}
              {children}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
);
