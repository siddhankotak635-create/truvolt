/**
 * Storytelling captions for the Portfolio film (site facts only).
 * `at` is the fraction of the clip's duration where the beat comes in; PortfolioMotion
 * reads video.duration at runtime, so the beats stay spread if the clip changes. Beat 01 also waits
 * for the opening title card (the clip starts as the frame fades up from black).
 */
export const FILM_BEATS = [
  { at: 0.1, text: 'Kolkata, 1970. One works, one standard.' },
  { at: 0.28, text: 'Designed, wound and tanked under one roof.' },
  { at: 0.46, text: 'Type-tested at CPRI, ERDA, IIT and Jadavpur University.' },
  { at: 0.64, text: 'Energised across nine countries, from Nepal to Nigeria.' },
  { at: 0.82, text: 'Fifty-five years on, still carrying load.' },
] as const;
