import { getProducts } from './actions';
import ProductList from '@/components/ProductList';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const products = await getProducts();

  return (
    <ProductList initialProducts={products} />
  );
}
