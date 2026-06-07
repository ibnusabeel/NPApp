import { getProducts } from "./actions";
import ProductList from "@/components/ProductList";

export const dynamic = "force-dynamic";

export default async function Home() {
    const { products, total, totalPages } = await getProducts(undefined, 1, 50);

    return (
        <ProductList
            initialProducts={products}
            initialTotal={total}
            initialTotalPages={totalPages}
        />
    );
}
