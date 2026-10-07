'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/shared';
import styles from './QuoteSection.module.css';

type FieldName = 'name' | 'company' | 'email' | 'phone' | 'rating' | 'voltage' | 'message';
type Errors = Partial<Record<FieldName, string>>;

const FIELDS: { name: FieldName; label: string; placeholder: string; type?: string; autoComplete?: string; required?: boolean }[] = [
  { name: 'name', label: 'Name', placeholder: 'Name', autoComplete: 'name', required: true },
  { name: 'company', label: 'Company', placeholder: 'Company', autoComplete: 'organization' },
  { name: 'email', label: 'Work email', placeholder: 'Work email', type: 'email', autoComplete: 'email', required: true },
  { name: 'phone', label: 'Phone', placeholder: 'Phone', type: 'tel', autoComplete: 'tel' },
  { name: 'rating', label: 'Rating', placeholder: 'Rating (e.g. 5 MVA)' },
  { name: 'voltage', label: 'Voltage', placeholder: 'Voltage (e.g. 33 / 11 kV)' },
];

const EMAIL = 'contact@truvolt.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Quote CTA (mockup #quote): dark card with a real form that opens a prefilled mailto. */
export function QuoteSection({ title }: { title: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const v = (k: FieldName) => String(data.get(k) ?? '').trim();

    const next: Errors = {};
    if (!v('name')) next.name = 'Please enter your name.';
    if (!v('email')) next.email = 'Please enter your work email.';
    else if (!EMAIL_RE.test(v('email'))) next.email = 'Please enter a valid email address.';
    if (!v('message')) next.message = 'Please describe the application and site.';
    setErrors(next);

    const firstBad = (['name', 'email', 'message'] as FieldName[]).find((k) => next[k]);
    if (firstBad) {
      setSent(false);
      form.querySelector<HTMLElement>(`[name="${firstBad}"]`)?.focus();
      return;
    }

    const subject = `Proposal request: ${title}`;
    const body = [
      `Product: ${title}`,
      `Name: ${v('name')}`,
      `Company: ${v('company')}`,
      `Email: ${v('email')}`,
      `Phone: ${v('phone')}`,
      `Rating: ${v('rating')}`,
      `Voltage: ${v('voltage')}`,
      '',
      v('message'),
    ].join('\n');
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  const errId = (k: FieldName) => `quote-${k}-error`;
  const fieldProps = (k: FieldName) => ({
    id: `quote-${k}`,
    name: k,
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? errId(k) : undefined,
    onInput: () => errors[k] && setErrors((e) => ({ ...e, [k]: undefined })),
  });

  return (
    <section id="quote" className={styles.section} aria-labelledby="quote-title">
      <div data-tv-reveal="" className={`${styles.card} tv-dark`}>
        <div className={styles.copy}>
          <p className={styles.label}>Request a proposal</p>
          <h2 id="quote-title" className={styles.title}>
            Send Us the Rating, Voltage and Site. We Return a Priced Design in 48 to 72 Hours.
          </h2>
          <p className={styles.note}>
            Every unit is routine-tested before dispatch.{' '}
            <Link href="/quality" className={styles.noteLink}>
              See our test sequence and standards <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
        <form className={styles.form} onSubmit={onSubmit} noValidate aria-label={`Proposal request: ${title}`}>
          <div className={styles.pairs}>
            {FIELDS.map((f) => (
              <div key={f.name} className={styles.field}>
                <label htmlFor={`quote-${f.name}`} className="visually-hidden">
                  {f.label}
                  {f.required ? ' (required)' : ''}
                </label>
                <input
                  {...fieldProps(f.name)}
                  type={f.type ?? 'text'}
                  placeholder={f.placeholder}
                  autoComplete={f.autoComplete}
                  required={f.required}
                  className={styles.input}
                />
                {errors[f.name] && (
                  <p id={errId(f.name)} className={styles.error}>
                    {errors[f.name]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className={styles.field}>
            <label htmlFor="quote-message" className="visually-hidden">
              Application, site conditions, standards required (required)
            </label>
            <textarea
              {...fieldProps('message')}
              placeholder="Application, site conditions, standards required"
              rows={3}
              required
              className={`${styles.input} ${styles.textarea}`}
            />
            {errors.message && (
              <p id={errId('message')} className={styles.error}>
                {errors.message}
              </p>
            )}
          </div>
          <Button type="submit" variant="light" size="lg" magnet arrow block>
            Send Specification
          </Button>
          <p className={styles.status} role="status" aria-live="polite">
            {sent && (
              <>
                Thank you. Your email app should open with the request ready to send. If it does not, write to{' '}
                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
              </>
            )}
          </p>
        </form>
      </div>
    </section>
  );
}
