/** Routine test sequence (verbatim from Truvolt Quality.dc.html TESTS). */
export type BayTest = {
  title: string;
  body: string;
  where: string;
  /** Live reading label */
  name: string;
  val: number;
  unit: string;
  /** Decimal places for the live reading */
  fmt: number;
};

export const TESTS: readonly BayTest[] = [
  { title: 'Ratio & Polarity', body: 'Confirms the turns ratio on every tap and the polarity of each winding against the nameplate.', where: 'Works', name: 'Ratio', val: 33.0, unit: ' kV / 11 kV', fmt: 2 },
  { title: 'Vector Group', body: 'Verifies the phase displacement and connection symbol, for example Dyn11, matches the specification.', where: 'Works', name: 'Vector group', val: 11, unit: ' Dyn', fmt: 0 },
  { title: 'No-Load & Load Losses', body: 'Measures core loss and copper loss. Low-loss CRGO and 99.9% copper keep both inside guaranteed figures.', where: 'Works', name: 'Load loss', val: 28.4, unit: ' kW', fmt: 1 },
  { title: 'Impedance', body: 'Short-circuit impedance measurement confirms voltage regulation and fault-current behaviour.', where: 'Works', name: 'Impedance', val: 6.25, unit: ' %', fmt: 2 },
  { title: 'Dielectric & Insulation Resistance', body: 'Separate-source and induced over-voltage tests plus IR verify winding insulation under rated and over-voltage conditions.', where: 'Works', name: 'Insulation resistance', val: 2450, unit: ' MΩ', fmt: 0 },
  { title: 'Temperature Rise', body: 'Confirms winding and oil temperatures remain within permissible limits under full-load operation.', where: 'Works', name: 'Oil temperature rise', val: 47.5, unit: ' K', fmt: 1 },
  { title: 'Impulse Withstand', body: 'Lightning impulse withstand on type-tested designs validates the insulation against surge conditions.', where: 'CPRI / ERDA', name: 'Impulse level', val: 170, unit: ' kVp', fmt: 0 },
  { title: 'Short-Circuit Withstand', body: 'Mechanical and thermal ability to survive through-fault conditions, validated at accredited laboratories.', where: 'CPRI / ERDA', name: 'Fault duration', val: 2.0, unit: ' s', fmt: 2 },
];

export const STATUS_WORKS = 'Within IS 2026 tolerance';
export const STATUS_LAB = 'Type test · accredited laboratory';
/** Tests from this index on run at accredited laboratories. */
export const LAB_FROM = 6;
