'use server';

import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { IProduct } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getProducts(query?: string): Promise<IProduct[]> {
    await dbConnect();
    const filter = query
        ? {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { code: { $regex: query, $options: 'i' } },
            ],
        }
        : {};

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    // Serialize _id and timestamps
    return products.map((p: any) => ({
        ...p,
        _id: p._id.toString(),
        createdAt: p.createdAt?.toISOString(),
        updatedAt: p.updatedAt?.toISOString(),
    }));
}

export async function getProduct(id: string): Promise<IProduct | null> {
    await dbConnect();
    const product = await Product.findById(id).lean();
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
        revalidatePath('/');
        return { success: true, id: product._id.toString() };
    } catch (error: any) {
        console.error('Create error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateProduct(id: string, data: Partial<IProduct>) {
    await dbConnect();
    try {
        await Product.findByIdAndUpdate(id, data, { new: true });
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteProduct(id: string) {
    await dbConnect();
    try {
        await Product.findByIdAndDelete(id);
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
