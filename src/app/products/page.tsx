import type { Metadata } from 'next';
import { ProductsExplorer } from '@/components/product/ProductsExplorer';

export const metadata: Metadata = {
  title: 'Products',
  description:
    'Distribution, power, furnace-duty, dry type and auto transformers, plus turnkey substations up to 132 kV. Built to IS 2026, IS 11171 and IEC 60076.',
};

/** One page for all six product lines; the hash picks the product (/products#power). */
export default function ProductsPage() {
  return <ProductsExplorer />;
}
