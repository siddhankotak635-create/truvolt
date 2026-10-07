import { clientRails, type Client } from '@/data/site';
import { ClientLogo } from './ClientLogo';
import styles from './Clients.module.css';

function ClientCard({ client }: { client: Client }) {
  return (
    <li data-tv-logo="" className={styles.card}>
      <div className={styles.logo}>
        <ClientLogo client={client} />
      </div>
      <div className={styles.meta}>
        <p className={styles.name}>{client.name}</p>
        <p className={styles.sector}>{client.sector}</p>
      </div>
    </li>
  );
}

/**
 * #clients: two velocity-reactive rails (ticker loop in HomeMotion).
 * Each rail renders its list twice for the seamless loop; the copy is aria-hidden.
 */
export function Clients() {
  return (
    <section id="clients" className={styles.section}>
      <div className={styles.head}>
        <h2 data-tv-reveal="" className={styles.title}>
          Trusted by India&apos;s Largest Public and Private Operators
        </h2>
        <div data-tv-reveal="" className={styles.aside}>
          <p className={styles.text}>
            Over 100 organisations run on Truvolt units: Maharatna PSUs, the country&apos;s largest EPC contractors and six
            state distribution companies. Hover or tap a row to hold it.
          </p>
          <p className={styles.note}>Government-approved supplier · Eastern India</p>
        </div>
      </div>
      <div className={styles.rails}>
        {clientRails.map((rail) => (
          <div key={rail.title}>
            <div data-tv-reveal="" className={styles.railHead}>
              <h3 className={styles.railTitle}>{rail.title}</h3>
              <span className={styles.railCount}>{rail.count}</span>
            </div>
            <div data-tv-rail-box="" className={styles.mask}>
              <div data-tv-rail="" data-tv-rail-dir={rail.dir} className={styles.rail}>
                <ul className={styles.list}>
                  {rail.clients.map((c) => (
                    <ClientCard key={c.name} client={c} />
                  ))}
                </ul>
                <ul className={`${styles.list} ${styles.dupe}`} aria-hidden="true">
                  {rail.clients.map((c) => (
                    <ClientCard key={c.name} client={c} />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
