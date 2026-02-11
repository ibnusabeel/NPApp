'use client';

import React, { useState, useMemo } from 'react';
import { IProduct, PRODUCT_CATEGORIES } from '@/types';
import Label from './Label';
import ProductForm from './ProductForm';
import Sidebar from './Sidebar';
import { deleteProduct } from '@/app/actions';
import {
    Search,
    Plus,
    Printer,
    Edit,
    Trash2,
    X,
    Grid3X3,
    List,
    Filter,
    Copy,
    MoreHorizontal,
    ChevronDown,
    Check
} from 'lucide-react';
import Link from 'next/link';

interface ProductListProps {
    initialProducts: IProduct[];
}

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'name' | 'code';

export default function ProductList({ initialProducts }: ProductListProps) {
    const [products] = useState<IProduct[]>(initialProducts);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [editingProduct, setEditingProduct] = useState<IProduct | undefined>(undefined);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    // Print Logic
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printQuantities, setPrintQuantities] = useState<Record<string, number>>({});

    const handlePrintClick = () => {
        const initialQuantities: Record<string, number> = {};
        selectedProducts.forEach(id => {
            initialQuantities[id] = 1;
        });
        setPrintQuantities(initialQuantities);
        setIsPrintModalOpen(true);
    };

    const updatePrintQuantity = (id: string, delta: number) => {
        setPrintQuantities(prev => ({
            ...prev,
            [id]: Math.max(1, (prev[id] || 1) + delta)
        }));
    };

    const getPrintUrl = () => {
        const query = Object.entries(printQuantities)
            .map(([id, quantity]) => `${id}:${quantity}`)
            .join(',');
        return `/print?q=${query}`;
    };

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let result = products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.code.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filterCategory) {
            result = result.filter(p => p.category === filterCategory);
        }

        // Sort
        switch (sortBy) {
            case 'oldest':
                result.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
                break;
            case 'name':
                result.sort((a, b) => a.name.localeCompare(b.name, 'th'));
                break;
            case 'code':
                result.sort((a, b) => a.code.localeCompare(b.code));
                break;
            default: // newest
                result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }

        return result;
    }, [products, searchTerm, filterCategory, sortBy]);

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProducts(newSelected);
    };

    const selectAll = () => {
        if (selectedProducts.size === filteredProducts.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(filteredProducts.map(p => p._id as string)));
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('คุณต้องการลบสินค้านี้หรือไม่?')) {
            await deleteProduct(id);
            window.location.reload();
        }
    };

    const handleBatchDelete = async () => {
        if (confirm(`คุณต้องการลบสินค้าที่เลือก ${selectedProducts.size} รายการหรือไม่?`)) {
            for (const id of selectedProducts) {
                await deleteProduct(id);
            }
            window.location.reload();
        }
    };

    const handleEdit = (product: IProduct) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingProduct(undefined);
        window.location.reload();
    };

    const openNewProductForm = () => {
        setEditingProduct(undefined);
        setIsFormOpen(true);
    };

    // Safe color generation for categories
    const getCategoryColor = (category?: string) => {
        const colors: Record<string, string> = {
            'บรรจุภัณฑ์': 'bg-blue-100 text-blue-800 border-blue-200',
            'เครื่องสำอาง': 'bg-pink-100 text-pink-800 border-pink-200',
            'อาหาร': 'bg-orange-100 text-orange-800 border-orange-200',
            'เครื่องดื่ม': 'bg-teal-100 text-teal-800 border-teal-200',
            'เครื่องเขียน': 'bg-purple-100 text-purple-800 border-purple-200',
            'ของใช้ในบ้าน': 'bg-indigo-100 text-indigo-800 border-indigo-200',
            'อิเล็กทรอนิกส์': 'bg-cyan-100 text-cyan-800 border-cyan-200',
            'อื่นๆ': 'bg-gray-100 text-gray-800 border-gray-200',
        };
        return colors[category || 'อื่นๆ'] || colors['อื่นๆ'];
    };

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Sidebar - Mobile Responsive */}
            <Sidebar onNewProduct={openNewProductForm} />

            {/* Main Content */}
            <main className="flex-1 w-full md:ml-64 transition-all duration-300 ease-in-out">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 md:px-6 md:py-4">
                    <div className="flex flex-col gap-4">
                        {/* Top Row: Search & Actions */}
                        <div className="flex items-center justify-between gap-3 pt-12 md:pt-0">
                            {/* Search */}
                            <div className="flex-1 relative group max-w-md">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        className="input pl-10 bg-secondary/50 border-transparent focus:bg-background h-10 md:h-11"
                                        placeholder="ค้นหาสินค้า..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Desktop Actions */}
                            <div className="hidden md:flex items-center gap-2">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`btn btn-secondary gap-2 ${showFilters ? 'bg-muted ring-2 ring-primary/20' : ''}`}
                                >
                                    <Filter className="w-4 h-4" />
                                    <span className="hidden lg:inline">ตัวกรอง</span>
                                </button>

                                <div className="flex items-center bg-secondary p-1 rounded-xl border border-border">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <Grid3X3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>

                                <button onClick={openNewProductForm} className="btn btn-primary gap-2 shadow-lg shadow-primary/25">
                                    <Plus className="w-4 h-4" />
                                    เพิ่มสินค้า
                                </button>
                            </div>

                            {/* Mobile Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="md:hidden btn btn-secondary p-2.5 h-10 w-10 md:h-11 md:w-11"
                            >
                                <Filter className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Filters (Collapsible) */}
                        {showFilters && (
                            <div className="flex flex-wrap items-center gap-3 animate-slide-in bg-secondary/30 p-3 rounded-xl border border-border/50">
                                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                    <span className="text-xs font-semibold uppercase text-muted-foreground">หมวดหมู่</span>
                                    <select
                                        className="input h-9 text-sm py-1"
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                    >
                                        <option value="">ทั้งหมด</option>
                                        {PRODUCT_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                    <span className="text-xs font-semibold uppercase text-muted-foreground">เรียงโดย</span>
                                    <select
                                        className="input h-9 text-sm py-1"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    >
                                        <option value="newest">ใหม่สุด</option>
                                        <option value="oldest">เก่าสุด</option>
                                        <option value="name">ชื่อสินค้า</option>
                                        <option value="code">รหัสสินค้า</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Selection Bar (Sticky) */}
                {selectedProducts.size > 0 && (
                    <div className="sticky top-[72px] md:top-[80px] z-10 bg-primary/10 border-b border-primary/20 px-4 md:px-6 py-3 flex items-center justify-between backdrop-blur-md supports-[backdrop-filter]:bg-primary/5">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={selectedProducts.size === filteredProducts.length}
                                onChange={selectAll}
                                className="w-5 h-5 rounded border-primary text-primary focus:ring-primary"
                            />
                            <span className="font-bold text-primary">
                                เลือก {selectedProducts.size} รายการ
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrintClick}
                                className="btn btn-primary gap-1.5 text-xs md:text-sm px-3 md:px-4"
                            >
                                <Printer className="w-4 h-4" /> <span className="hidden md:inline">พิมพ์ป้าย</span>
                            </button>
                            <button onClick={handleBatchDelete} className="btn btn-danger gap-1.5 text-xs md:text-sm px-3 md:px-4">
                                <Trash2 className="w-4 h-4" /> <span className="hidden md:inline">ลบ</span>
                            </button>
                            <button
                                onClick={() => setSelectedProducts(new Set())}
                                className="btn btn-ghost text-xs md:text-sm px-3"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Product Grid/List */}
                <div className="p-4 md:p-6 pb-24 md:pb-6">
                    {filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">ไม่พบสินค้า</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                                ลองค้นหาด้วยคำอื่น หรือเพิ่มสินค้าใหม่
                            </p>
                            <button onClick={openNewProductForm} className="btn btn-primary gap-2">
                                <Plus className="w-4 h-4" /> เพิ่มสินค้าใหม่
                            </button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {filteredProducts.map((product) => {
                                const isSelected = selectedProducts.has(product._id as string);
                                return (
                                    <div
                                        key={product._id}
                                        className={`
                      card relative group overflow-hidden transition-all duration-300
                      ${isSelected
                                                ? 'ring-2 ring-primary border-primary shadow-lg shadow-primary/10'
                                                : 'hover:border-primary/50 hover:shadow-xl hover:-translate-y-1'
                                            }
                    `}
                                        onClick={(e) => {
                                            // Toggle select if clicking card body (not buttons)
                                            if ((e.target as HTMLElement).closest('button, input')) return;
                                            // Optional: handle card click
                                        }}
                                    >
                                        {/* Selection Checkbox */}
                                        <div className="absolute top-3 right-3 z-10">
                                            <div className={`
                        relative w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center
                        ${isSelected ? 'bg-primary border-primary scale-110' : 'bg-white border-muted-foreground/30 hover:border-primary scale-100'}
                      `}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(product._id as string)}
                                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                                />
                                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                        </div>

                                        <div className="p-5">
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-4 pr-8">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                                                            {product.code}
                                                        </span>
                                                        {product.category && (
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${getCategoryColor(product.category)}`}>
                                                                {product.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3
                                                        className="font-bold text-lg text-foreground leading-tight line-clamp-2 min-h-[3rem]"
                                                        title={product.name}
                                                    >
                                                        {product.name}
                                                    </h3>
                                                </div>
                                            </div>

                                            {/* Label Preview (Mini) */}
                                            <div className="bg-secondary/30 rounded-xl p-2 mb-4 overflow-hidden border border-border/50 flex justify-center items-center h-[100px] relative group-hover:bg-secondary/50 transition-colors">
                                                <div className="origin-center scale-[0.45] shadow-sm transform-gpu transition-transform group-hover:scale-[0.48]">
                                                    <Label product={product} />
                                                </div>
                                            </div>

                                            {/* Footer Info */}
                                            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3 mt-auto">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{product.prices.length} ราคา</span>
                                                    <span>{product.labelWidth}x{product.labelHeight} ซม.</span>
                                                </div>

                                                <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                                                        className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                                                        title="แก้ไข"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(product._id as string); }}
                                                        className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                                        title="ลบ"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product._id}
                                    className={`
                    card flex items-center gap-4 p-4 transition-all
                    ${selectedProducts.has(product._id as string)
                                            ? 'ring-2 ring-primary border-primary bg-primary/5'
                                            : 'hover:border-primary/30 hover:bg-secondary/30'
                                        }
                  `}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.has(product._id as string)}
                                        onChange={() => toggleSelect(product._id as string)}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-foreground text-base truncate">{product.name}</h3>
                                            {product.category && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${getCategoryColor(product.category)}`}>
                                                    {product.category}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <span className="font-mono bg-secondary px-1 rounded">{product.code}</span>
                                            <span>•</span>
                                            <span>{product.packing}</span>
                                        </p>
                                    </div>

                                    <div className="hidden sm:block text-right">
                                        <div className="font-medium text-foreground">{product.prices.length} ราคา</div>
                                        <div className="text-xs text-muted-foreground">{product.labelWidth}×{product.labelHeight} ซม.</div>
                                    </div>

                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="btn btn-secondary p-2 h-9 w-9"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product._id as string)}
                                            className="btn btn-secondary p-2 h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Mobile FAB (Adds Product) */}
                <button
                    onClick={openNewProductForm}
                    className="md:hidden fixed bottom-6 right-6 z-30 btn btn-primary h-14 w-14 rounded-full shadow-xl shadow-primary/30 flex items-center justify-center animate-bounce-in"
                >
                    <Plus className="w-7 h-7" />
                </button>
            </main>

            {/* Modal - Full Screen on Mobile */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
                    <div className="bg-card w-full h-full md:h-auto md:max-h-[85vh] md:max-w-2xl md:rounded-2xl shadow-2xl flex flex-col animate-slide-in overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-border bg-card sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                {editingProduct ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                                {editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
                            </h2>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary/20">
                            <ProductForm
                                product={editingProduct}
                                onSuccess={closeForm}
                                onCancel={() => setIsFormOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Print Settings Modal */}
            {isPrintModalOpen && (
                <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl flex flex-col animate-slide-in overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-border bg-card sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <Printer className="w-5 h-5 text-primary" />
                                ตั้งค่าการพิมพ์
                            </h2>
                            <button
                                onClick={() => setIsPrintModalOpen(false)}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-secondary/20 max-h-[60vh]">
                            <div className="space-y-3">
                                {Array.from(selectedProducts).map(id => {
                                    const product = products.find(p => p._id === id);
                                    if (!product) return null;
                                    return (
                                        <div key={id} className="bg-card p-3 rounded-lg border border-border flex items-center justify-between">
                                            <div className="flex-1 min-w-0 mr-4">
                                                <div className="font-bold truncate">{product.name}</div>
                                                <div className="text-xs text-muted-foreground">{product.code}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => updatePrintQuantity(id, -1)}
                                                    className="w-8 h-8 rounded-full bg-secondary text-foreground hover:bg-muted flex items-center justify-center transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center font-bold text-lg">{printQuantities[id] || 1}</span>
                                                <button
                                                    onClick={() => updatePrintQuantity(id, 1)}
                                                    className="w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors shadow-sm"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-4 border-t border-border bg-card flex justify-end gap-3">
                            <button
                                onClick={() => setIsPrintModalOpen(false)}
                                className="btn btn-secondary"
                            >
                                ยกเลิก
                            </button>
                            <Link
                                href={getPrintUrl()}
                                className="btn btn-primary gap-2"
                                target="_blank"
                                onClick={() => setIsPrintModalOpen(false)}
                            >
                                <Printer className="w-4 h-4" />
                                พิมพ์ {Object.values(printQuantities).reduce((a, b) => a + b, 0)} ใบ
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
