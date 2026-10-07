import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Eyebrow.module.css';

export type EyebrowProps = {
  children: ReactNode;
  /** light (default, #4c535a on the light surface) or dark (#9fb2c7 on #161819) */
  tone?: 'light' | 'dark';
  as?: 'p' | 'span' | 'div' | 'h2' | 'h3';
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'>;

/** Mono uppercase label (12px, .14em). No leading rule. */
export function Eyebrow({ children, tone = 'light', as: Tag = 'p', className, ...rest }: EyebrowProps) {
  const cls = [styles.eyebrow, tone === 'dark' && styles.dark, className].filter(Boolean).join(' ');
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
