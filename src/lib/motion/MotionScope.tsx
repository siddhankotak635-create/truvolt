'use client';

import { useRef, type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import { useTvMotion } from './useTvMotion';
import { initPageCore, type PageCoreOptions } from './helpers';

export type MotionScopeProps = {
  children: ReactNode;
  /** Element to render. Default 'div'. */
  as?: ElementType;
  /** Options for initPageCore. Default: everything on (intro included). */
  core?: PageCoreOptions;
} & HTMLAttributes<HTMLElement>;

/**
 * Drop-in client wrapper that runs initPageCore on its subtree, so server
 * components can use data-tv-reveal / data-tv-split / data-tv-words /
 * data-tv-parallax / data-tv-count without writing a motion component.
 */
export function MotionScope({ children, as: Tag = 'div', core, ...rest }: MotionScopeProps) {
  const ref = useRef<HTMLElement>(null);
  useTvMotion(ref, ({ scope }) => initPageCore(scope, core));
  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  );
}
