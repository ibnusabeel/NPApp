'use client';

import React, { useState } from 'react';
import { IProduct, IPrice, PRODUCT_UNITS, PRODUCT_CATEGORIES, DEFAULT_LABEL_WIDTH, DEFAULT_LABEL_HEIGHT } from '@/types';
import { createProduct, updateProduct } from '@/app/actions';
import { Plus, Trash2, Save, X, ChevronDown, Package, Tag, Ruler, DollarSign } from 'lucide-react';

interface ProductFormProps {
    product?: Partial<IProduct>;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
    const [formData, setFormData] = useState<Partial<IProduct>>({
        name: product?.name || '',
        code: product?.code || '',
        packing: product?.packing || '',
        unit: product?.unit || 'ชิ้น',
        category: product?.category || '',
        labelWidth: product?.labelWidth || DEFAULT_LABEL_WIDTH,
        labelHeight: product?.labelHeight || DEFAULT_LABEL_HEIGHT,
        prices: product?.prices || [{ quantity: 0, price: 0, unit: 'ชิ้น' }],
    });
    const [loading, setLoading] = useState(false);
    const [customUnit, setCustomUnit] = useState('');
    const [showCustomUnit, setShowCustomUnit] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const cleanedData = {
            ...formData,
            unit: showCustomUnit && customUnit ? customUnit : formData.unit,
            prices: formData.prices?.filter(p => p.quantity > 0 || p.price > 0),
        };

        if (product?._id) {
            await updateProduct(product._id, cleanedData);
        } else {
            await createProduct(cleanedData);
        }
        setLoading(false);
        onSuccess();
    };

    const handlePriceChange = (index: number, field: keyof IPrice, value: string) => {
        const newPrices = [...(formData.prices || [])];
        if (field === 'unit') {
            newPrices[index] = { ...newPrices[index], [field]: value };
        } else {
            newPrices[index] = { ...newPrices[index], [field]: parseFloat(value) || 0 };
        }
        setFormData({ ...formData, prices: newPrices });
    };

    const addPriceRow = () => {
        const defaultUnit = showCustomUnit && customUnit ? customUnit : formData.unit;
        setFormData({
            ...formData,
            prices: [...(formData.prices || []), { quantity: 0, price: 0, unit: defaultUnit }],
        });
    };

    const removePriceRow = (index: number) => {
        const newPrices = [...(formData.prices || [])];
        newPrices.splice(index, 1);
        setFormData({ ...formData, prices: newPrices });
    };

    // Update all prices when main unit changes
    const handleMainUnitChange = (newUnit: string) => {
        const newPrices = formData.prices?.map(p => ({
            ...p,
            unit: p.unit || newUnit, // Only update if no unit set
        }));
        setFormData({ ...formData, unit: newUnit, prices: newPrices });
    };

    const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50 text-primary">
            <Icon className="w-5 h-5" />
            <h3 className="font-semibold text-base">{title}</h3>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pb-20 md:pb-0">
            {/* Basic Info */}
            <div className="space-y-4">
                <SectionHeader icon={Tag} title="ข้อมูลพื้นฐาน" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-1.5">ชื่อสินค้า</label>
                        <input
                            type="text"
                            required
                            className="input h-11"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="เช่น ขวดแบนยาดม 5 มล ฝาขาว"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">รหัสสินค้า</label>
                        <input
                            type="text"
                            required
                            className="input h-11 font-mono"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="เช่น WG-05-161-2VA"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">หมวดหมู่</label>
                        <select
                            className="input h-11"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="">-- เลือกหมวดหมู่ --</option>
                            {PRODUCT_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Packing & Unit */}
            <div className="space-y-4">
                <SectionHeader icon={Package} title="การบรรจุและหน่วย" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">บรรจุภัณฑ์</label>
                        <input
                            type="text"
                            required
                            className="input h-11"
                            value={formData.packing}
                            onChange={(e) => setFormData({ ...formData, packing: e.target.value })}
                            placeholder="เช่น 1 ลัง บรรจุ 616 ชิ้น"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">หน่วยนับหลัก</label>
                        {showCustomUnit ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="input h-11 flex-1"
                                    value={customUnit}
                                    onChange={(e) => setCustomUnit(e.target.value)}
                                    placeholder="ระบุหน่วย..."
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCustomUnit(false)}
                                    className="btn btn-secondary h-11"
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <select
                                    className="input h-11 flex-1"
                                    value={formData.unit}
                                    onChange={(e) => handleMainUnitChange(e.target.value)}
                                >
                                    {PRODUCT_UNITS.map((unit) => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomUnit(true)}
                                    className="btn btn-secondary h-11 whitespace-nowrap"
                                >
                                    อื่นๆ
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Label Dimensions */}
            <div className="space-y-4">
                <SectionHeader icon={Ruler} title="ขนาดป้าย (ซม.)" />
                <div className="flex flex-wrap items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                    <div className="flex-1 min-w-[120px]">
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">ความกว้าง</label>
                        <div className="relative">
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                min="1"
                                max="30"
                                className="input h-11 pl-4 pr-8"
                                value={formData.labelWidth}
                                onChange={(e) => setFormData({ ...formData, labelWidth: parseFloat(e.target.value) || DEFAULT_LABEL_WIDTH })}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ซม.</span>
                        </div>
                    </div>
                    <div className="hidden md:block text-muted-foreground">×</div>
                    <div className="flex-1 min-w-[120px]">
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">ความสูง</label>
                        <div className="relative">
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                min="1"
                                max="30"
                                className="input h-11 pl-4 pr-8"
                                value={formData.labelHeight}
                                onChange={(e) => setFormData({ ...formData, labelHeight: parseFloat(e.target.value) || DEFAULT_LABEL_HEIGHT })}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ซม.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Prices */}
            <div className="space-y-4">
                <SectionHeader icon={DollarSign} title="ราคาขายส่ง" />
                <div className="space-y-3">
                    {formData.prices?.map((price, index) => (
                        <div
                            key={index}
                            className="flex flex-col sm:flex-row gap-3 items-start sm:items-end bg-card border border-border p-4 rounded-xl shadow-sm relative group"
                        >
                            <div className="absolute top-2 right-2 sm:hidden">
                                <button
                                    type="button"
                                    onClick={() => removePriceRow(index)}
                                    className="p-1.5 text-muted-foreground hover:text-red-500 rounded-full"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Quantity */}
                            <div className="w-full sm:flex-1">
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">จำนวนขั้นต่ำ</label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    className="input h-10"
                                    placeholder="0"
                                    value={price.quantity || ''}
                                    onChange={(e) => handlePriceChange(index, 'quantity', e.target.value)}
                                />
                            </div>

                            {/* Price */}
                            <div className="w-full sm:flex-1">
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">ราคาต่อหน่วย (฿)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    className="input h-10"
                                    placeholder="0.00"
                                    value={price.price || ''}
                                    onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
                                />
                            </div>

                            {/* Unit Selector per tier */}
                            <div className="w-full sm:flex-1">
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">หน่วย</label>
                                <select
                                    className="input h-10"
                                    value={price.unit || formData.unit}
                                    onChange={(e) => handlePriceChange(index, 'unit', e.target.value)}
                                >
                                    {PRODUCT_UNITS.map((unit) => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                    {showCustomUnit && customUnit && (
                                        <option value={customUnit}>{customUnit}</option>
                                    )}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={() => removePriceRow(index)}
                                className="hidden sm:flex p-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-[1px]"
                                title="ลบรายการ"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={addPriceRow}
                    className="w-full sm:w-auto btn btn-secondary gap-2 text-sm mt-2 border-dashed"
                >
                    <Plus className="w-4 h-4" /> เพิ่มช่วงราคาใหม่
                </button>
            </div>

            {/* Actions Sticky Footer for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border flex justify-end gap-3 md:bg-transparent md:border-0 md:relative md:p-0 z-20">
                <div className="w-full md:w-auto flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 md:flex-none btn btn-secondary gap-2"
                    >
                        <X className="w-4 h-4" /> ยกเลิก
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 md:flex-none btn btn-primary gap-2 shadow-lg shadow-primary/20"
                    >
                        <Save className="w-4 h-4" /> {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </div>
            </div>
        </form>
    );
}
