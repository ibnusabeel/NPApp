"use server";

import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { IProduct } from "@/types";
import { revalidatePath } from "next/cache";

export async function getProducts(
    query?: string,
    page: number = 1,
    limit: number = 50,
): Promise<{
    products: IProduct[];
    total: number;
    page: number;
    totalPages: number;
}> {
    await dbConnect();
    const filter = query
        ? {
              $or: [
                  { name: { $regex: query, $options: "i" } },
                  { code: { $regex: query, $options: "i" } },
              ],
          }
        : {};

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
        Product.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Product.countDocuments(filter),
    ]);

    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        products: products.map((p: any) => ({
            ...p,
            _id: p._id.toString(),
            createdAt: p.createdAt?.toISOString(),
            updatedAt: p.updatedAt?.toISOString(),
        })) as unknown as IProduct[],
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

export async function getProduct(id: string): Promise<IProduct | null> {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product: any = await Product.findById(id).lean();
    if (!product) return null;
    return {
        ...product,
        _id: product._id.toString(),
        createdAt: product.createdAt?.toISOString(),
        updatedAt: product.updatedAt?.toISOString(),
    };
}

export async function createProduct(data: Partial<IProduct>) {
    await dbConnect();
    try {
        const product = await Product.create(data);
        revalidatePath("/");
        return { success: true, id: product._id.toString() };
    } catch (error) {
        const err = error as { message?: string };
        console.error("Create error:", error);
        return { success: false, error: err.message || "Unknown error" };
    }
}

export async function updateProduct(id: string, data: Partial<IProduct>) {
    await dbConnect();
    try {
        await Product.findByIdAndUpdate(id, data, { new: true });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        const err = error as { message?: string };
        return { success: false, error: err.message || "Unknown error" };
    }
}

export async function searchProducts(
    query?: string,
    page: number = 1,
    limit: number = 50,
) {
    return getProducts(query, page, limit);
}

export async function deleteProduct(id: string) {
    await dbConnect();
    try {
        await Product.findByIdAndDelete(id);
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        const err = error as { message?: string };
        return { success: false, error: err.message || "Unknown error" };
    }
}
