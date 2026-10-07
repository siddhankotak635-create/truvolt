import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'dark' | 'light' | 'outline' | 'outlineLight';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Common = {
  children: ReactNode;
  /** dark (default) · light (on dark surfaces) · outline · outlineLight (outline on dark) */
  variant?: ButtonVariant;
  /** sm = nav CTA (10/18, 14px) · md = hero buttons (12/20, 14px, default) · lg = CTA band (16/24, 15px) */
  size?: ButtonSize;
  /** Append <span aria-hidden>→</span> (nudged on hover by MotionProvider) */
  arrow?: boolean;
  /** Adds data-tv-magnet: fill sweep + pointer follow on fine pointers */
  magnet?: boolean;
  /** Full width */
  block?: boolean;
  className?: string;
};

type LinkProps = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children' | 'className'>;
type NativeButtonProps = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>;

export type ButtonProps = LinkProps | NativeButtonProps;

const isExternal = (href: string) => /^(mailto:|tel:|https?:\/\/|\/\/)/.test(href);

/**
 * Pill button. Renders next/link for internal hrefs, <a> for mailto:/tel:/http(s),
 * and <button> when no href is given.
 */
export function Button(props: ButtonProps) {
  const { children, variant = 'dark', size = 'md', arrow, magnet, block, className, ...rest } = props;
  const cls = [styles.btn, styles[variant], styles[size], block && styles.block, className].filter(Boolean).join(' ');
  const inner = (
    <>
      {magnet && <span className={styles.fill} data-tv-magnet-fill="" aria-hidden="true" />}
      <span>{children}</span>
      {arrow && (
        <span className={styles.arrow} data-tv-arrow="" aria-hidden="true">
          →
        </span>
      )}
    </>
  );
  const magnetAttr = magnet ? { 'data-tv-magnet': '' } : {};

  if ('href' in rest && typeof rest.href === 'string') {
    const { href, ...anchorRest } = rest as LinkProps;
    if (isExternal(href)) {
      const ext = /^https?:/.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {};
      return (
        <a href={href} className={cls} {...ext} {...magnetAttr} {...anchorRest}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...magnetAttr} {...anchorRest}>
        {inner}
      </Link>
    );
  }
  const { type = 'button', ...btnRest } = rest as NativeButtonProps;
  return (
    <button type={type} className={cls} {...magnetAttr} {...btnRest}>
      {inner}
    </button>
  );
}
