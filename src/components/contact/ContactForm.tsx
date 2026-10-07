'use client';

import { useEffect, useRef, useState, type FormEvent, type FocusEvent } from 'react';
import { Button } from '@/components/shared/Button';
import styles from './ContactForm.module.css';

type FieldName = 'name' | 'company' | 'email' | 'phone' | 'subject' | 'message';
type Errors = Partial<Record<FieldName, string>>;

/** The 10 subject options, verbatim from Truvolt Contact.dc.html (first is the empty prompt). */
const SUBJECTS = [
  'Request a proposal: Distribution Transformer',
  'Request a proposal: Power Transformer',
  'Request a proposal: Furnace Duty Transformer',
  'Request a proposal: Dry Type Transformer',
  'Request a proposal: Auto Transformer',
  'Turnkey substation project',
  'Test certificates and documentation',
  'After-sales and service',
  'Other',
];

const ORDER: FieldName[] = ['name', 'company', 'email', 'phone', 'subject', 'message'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateField(name: FieldName, raw: string): string | undefined {
  const v = raw.trim();
  switch (name) {
    case 'name':
      return v ? undefined : 'Please enter your name.';
    case 'company':
      return v ? undefined : 'Please enter your company or organisation.';
    case 'email':
      if (!v) return 'Please enter your email address.';
      return EMAIL_RE.test(v) ? undefined : 'Please enter a valid email address, e.g. name@company.com.';
    case 'subject':
      return v ? undefined : 'Please select a subject.';
    case 'message':
      return v ? undefined : 'Please describe your requirement.';
    default:
      return undefined;
  }
}

function validateAll(form: HTMLFormElement): Errors {
  const f = new FormData(form);
  const errors: Errors = {};
  ORDER.forEach((n) => {
    const e = validateField(n, String(f.get(n) ?? ''));
    if (e) errors[n] = e;
  });
  return errors;
}

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [attempted, setAttempted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const errs = validateAll(form);
    setAttempted(true);
    setErrors(errs);
    const first = ORDER.find((n) => errs[n]);
    if (first) {
      (form.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    // mailto, built exactly as the mockup's submit handler
    const f = new FormData(form);
    const body = [
      'Name: ' + f.get('name'),
      'Company: ' + f.get('company'),
      'Email: ' + f.get('email'),
      'Phone: ' + (f.get('phone') || ''),
      '',
      f.get('message'),
    ].join('\n');
    const href =
      'mailto:contact@truvolt.com?subject=' + encodeURIComponent(String(f.get('subject'))) + '&body=' + encodeURIComponent(body);
    window.location.href = href;
    // Keep the values (the form stays mounted, hidden) until "Send another", in case the mail client never opened.
    setAttempted(false);
    setErrors({});
    setSent(true);
  };

  useEffect(() => {
    if (!sent) return;
    const id = requestAnimationFrame(() => successRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [sent]);

  const onBlur = (e: FocusEvent<HTMLFormElement>) => {
    if (!attempted) return;
    const t = e.target as unknown as HTMLInputElement;
    const name = t.name as FieldName;
    if (!ORDER.includes(name)) return;
    const msg = validateField(name, t.value);
    setErrors((prev) => (prev[name] === msg ? prev : { ...prev, [name]: msg }));
  };

  // While a field shows an error, re-check it as the user types so the message clears before blur.
  // (Clearing it on blur instead shifts the layout mid-click and swallows the submit click.)
  const onChange = (e: FormEvent<HTMLFormElement>) => {
    const t = e.target as unknown as HTMLInputElement;
    const name = t.name as FieldName;
    if (!attempted || !errors[name]) return;
    const msg = validateField(name, t.value);
    setErrors((prev) => (prev[name] === msg ? prev : { ...prev, [name]: msg }));
  };

  const sendAnother = () => {
    formRef.current?.reset();
    setSent(false);
    requestAnimationFrame(() => (formRef.current?.elements.namedItem('name') as HTMLElement | null)?.focus());
  };

  const fieldProps = (name: FieldName) => {
    const err = errors[name];
    return {
      id: `cf-${name}`,
      name,
      className: styles.input,
      'aria-invalid': err ? true : undefined,
      'aria-describedby': err ? `cf-${name}-err` : undefined,
    } as const;
  };

  const errorFor = (name: FieldName) => (
    <p id={`cf-${name}-err`} className={styles.error} hidden={!errors[name]}>
      {errors[name]}
    </p>
  );

  const success = sent && (
    <div ref={successRef} className={`${styles.card} ${styles.success}`} role="status" tabIndex={-1}>
      <p className={styles.small}>Message ready</p>
      <h2 className={styles.heading}>Thanks. Your email client should now be open…</h2>
      <p className={styles.successBody}>
        Your message is addressed to <a href="mailto:contact@truvolt.com">contact@truvolt.com</a> with the subject and
        details filled in. Send it from your email client and our engineers will reply within 48 to 72 hours.
      </p>
      <div>
        <Button variant="outline" size="lg" onClick={sendAnother}>
          Send another
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {success}
      <form ref={formRef} data-tv-form="" className={styles.card} hidden={sent} noValidate onSubmit={onSubmit} onBlur={onBlur} onChange={onChange}>
        <div className="visually-hidden" role="status" aria-live="polite">
          {Object.keys(errors).length
            ? `${Object.keys(errors).length} field${Object.keys(errors).length > 1 ? 's need' : ' needs'} attention. ` +
              ORDER.filter((n) => errors[n]).map((n) => errors[n]).join(' ')
            : ''}
        </div>
        <div className={styles.head}>
          <h2 className={styles.heading}>Send us a message</h2>
          <p className={styles.small}>All fields marked * required</p>
        </div>

        <div className={styles.field}>
          <label htmlFor="cf-name" className={styles.label}>
            Name <span aria-hidden="true">*</span>
          </label>
          <input {...fieldProps('name')} required placeholder="Full name" autoComplete="name" />
          {errorFor('name')}
        </div>
        <div className={styles.field}>
          <label htmlFor="cf-company" className={styles.label}>
            Company <span aria-hidden="true">*</span>
          </label>
          <input {...fieldProps('company')} required placeholder="Organisation" autoComplete="organization" />
          {errorFor('company')}
        </div>
        <div className={styles.field}>
          <label htmlFor="cf-email" className={styles.label}>
            Email <span aria-hidden="true">*</span>
          </label>
          <input {...fieldProps('email')} type="email" required placeholder="name@company.com" autoComplete="email" />
          {errorFor('email')}
        </div>
        <div className={styles.field}>
          <label htmlFor="cf-phone" className={styles.label}>
            Phone
          </label>
          <input {...fieldProps('phone')} type="tel" placeholder="+91" autoComplete="tel" />
        </div>
        <div className={`${styles.field} ${styles.span2}`}>
          <label htmlFor="cf-subject" className={styles.label}>
            Subject <span aria-hidden="true">*</span>
          </label>
          <select {...fieldProps('subject')} required defaultValue="">
            <option value="">Select a subject</option>
            {SUBJECTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {errorFor('subject')}
        </div>
        <div className={`${styles.field} ${styles.span2}`}>
          <label htmlFor="cf-message" className={styles.label}>
            Message <span aria-hidden="true">*</span>
          </label>
          <textarea
            {...fieldProps('message')}
            className={`${styles.input} ${styles.textarea}`}
            required
            rows={5}
            placeholder="Rating, voltage class, application, site conditions, standards required"
          />
          {errorFor('message')}
        </div>

        <div className={styles.foot}>
          <p className={styles.note}>
            Your message opens in your email client addressed to contact@truvolt.com until the form is connected to a mail
            service.
          </p>
          <Button type="submit" magnet arrow size="lg" className={styles.submit}>
            Send Message
          </Button>
        </div>
      </form>
    </>
  );
}
