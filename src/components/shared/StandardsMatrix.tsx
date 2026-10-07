import type { HTMLAttributes } from 'react';
import { markLabel, standardsColumns, standardsMatrix, type Mark } from '@/data/site';
import styles from './StandardsMatrix.module.css';

export type StandardsMatrixProps = {
  rows?: { product: string; marks: Mark[] }[];
  columns?: readonly string[];
  /** Visually hidden table caption */
  caption?: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, 'className'>;

const markClass = (m: Mark) => (m === 1 ? styles.yes : m === 2 ? styles.request : styles.na);

/**
 * Compliance matrix from the Quality page as a real <table>.
 * Rows carry data-tv-row so a page can stagger them in.
 * Below 768px each row becomes a stacked card.
 */
export function StandardsMatrix({
  rows = standardsMatrix,
  columns = standardsColumns,
  caption = 'Standards compliance by product',
  className,
  ...rest
}: StandardsMatrixProps) {
  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')} {...rest}>
      <table className={styles.table} role="table">
        <caption className="visually-hidden">{caption}</caption>
        <colgroup>
          <col className={styles.colProduct} />
          {columns.map((c) => (
            <col key={c} />
          ))}
        </colgroup>
        <thead className={styles.head} role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader" className={styles.thProduct}>
              Product
            </th>
            {columns.map((c) => (
              <th key={c} scope="col" role="columnheader">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((r) => (
            <tr key={r.product} data-tv-row="" role="row" className={styles.row}>
              <th scope="row" role="rowheader" className={styles.product}>
                {r.product}
              </th>
              {r.marks.map((m, i) => (
                <td key={columns[i]} role="cell" data-label={columns[i]} className={`${styles.mark} ${markClass(m)}`}>
                  {markLabel(m)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
