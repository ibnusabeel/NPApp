import React from 'react';
import { IProduct } from '@/types';

interface LabelProps {
    product: IProduct;
    scale?: number;
}

const Label: React.FC<LabelProps> = ({ product, scale = 1 }) => {
    const width = product.labelWidth || 10;
    const height = product.labelHeight || 2.5;

    // Calculate dynamic font size for single-line header
    // Base size 16px, shrink if name is long
    const nameLength = product.name.length;
    let nameFontSize = 16;

    if (nameLength > 25) nameFontSize = 14;
    if (nameLength > 35) nameFontSize = 12;
    if (nameLength > 45) nameFontSize = 11;
    if (nameLength > 60) nameFontSize = 10;

    return (
        <div
            className="relative overflow-hidden bg-white flex flex-col border border-gray-200"
            style={{
                width: `${width}cm`,
                height: `${height}cm`,
                transform: scale !== 1 ? `scale(${scale})` : undefined,
                transformOrigin: 'top left',
                fontFamily: "'IBM Plex Sans Thai Looped', sans-serif",
            }}
        >
            {/* HEADER: Product Name (Single Line + Auto-Shrink) */}
            <div
                className="flex items-center px-2 bg-orange-500 text-white overflow-hidden"
                style={{ height: '32%', minHeight: '32%' }}
            >
                <h3
                    className="font-bold leading-none w-full text-center whitespace-nowrap "
                    style={{ fontSize: `${nameFontSize}px` }}
                >
                    {product.name}
                </h3>
            </div>

            {/* BODY: Prices & Info */}
            <div className="flex-1 flex flex-row min-h-0">
                {/* Left: Code & Packing (25%) */}
                <div
                    className="flex flex-col justify-center px-1 bg-gray-50 border-r border-gray-200 py-1"
                    style={{ width: '25%', minWidth: '25%' }}
                >
                    <div className="text-gray-500 font-mono text-[9px] truncate text-center mb-0.5">
                        {product.code}
                    </div>
                    <div className="text-gray-800 text-[10px] font-medium text-center leading-tight line-clamp-2">
                        ลังละ {product.packing} {product.unit || 'ชิ้น'}
                    </div>
                </div>

                {/* Right: Prices (75%) */}
                <div className="flex-1 px-3 flex flex-col justify-center min-w-0">
                    <div
                        className="grid gap-x-2 w-full"
                        style={{
                            gridTemplateColumns: product.prices.length > 6 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                            gap: product.prices.length > 6 ? '1px 4px' : '1px 12px',
                            alignContent: 'center',
                        }}
                    >
                        {product.prices.slice(0, 9).map((p, i) => (
                            <div
                                key={i}
                                className="flex justify-between items-baseline border-b border-gray-100 last:border-0"
                                style={{ paddingBottom: '1px', minWidth: 0 }}
                            >
                                <span className={`text-gray-600 font-medium whitespace-nowrap truncate mr-1 ${product.prices.length > 6 ? 'text-[9px]' : 'text-[11px]'}`}>
                                    {p.quantity} {p.unit || product.unit || 'ชิ้น'}
                                </span>
                                <span className={`font-bold text-orange-600 whitespace-nowrap ${product.prices.length > 6 ? 'text-[11px]' : 'text-[13px]'}`}>
                                    {p.price.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Label;
