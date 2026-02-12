import React from 'react';
import { IProduct } from '@/types';
import { getPriceCardColor, getCategoryTheme } from '@/lib/colors';

interface LabelProps {
    product: IProduct;
    scale?: number;
}

const Label: React.FC<LabelProps> = ({ product, scale = 1 }) => {
    const width = product.labelWidth || 10;
    const height = product.labelHeight || 2.5;
    const isSinglePrice = product.prices.length === 1;

    // Calculate dynamic font size for header
    const nameLength = product.name.length;
    let nameFontSize = 20;
    if (nameLength > 25) nameFontSize = 16;
    if (nameLength > 35) nameFontSize = 15;
    if (nameLength > 45) nameFontSize = 14;

    const theme = getCategoryTheme(product.category);
    const accentBorderClass = `border-l-8 ${theme.border}`;

    return (
        <div
            className={`relative overflow-hidden bg-white flex flex-row shadow-sm border ${theme.thinBorder || 'border-gray-200'} ${accentBorderClass}`}
            style={{
                width: `${width}cm`,
                height: `${height}cm`,
                transform: scale !== 1 ? `scale(${scale})` : undefined,
                transformOrigin: 'top left',
                fontFamily: "'IBM Plex Sans Thai Looped', sans-serif",
            }}
        >
            {/* Left Content: Name & Info */}
            <div className="flex-1 flex flex-col justify-between p-2 min-w-0">
                <div className="flex flex-col">
                    <h3
                        className="font-bold text-gray-900 leading-tight mb-1"
                        style={{ fontSize: `${nameFontSize}px` }}
                    >
                        {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                            {product.code}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">
                            {product.packing} {product.unit || 'ชิ้น'}/ลัง
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Content: Price(s) */}
            <div
                className="flex flex-col justify-center p-1.5 bg-gray-50/50 border-l border-gray-100"
                style={{ width: isSinglePrice ? '35%' : '55%', minWidth: isSinglePrice ? '35%' : '5%' }}
            >
                {isSinglePrice ? (
                    // Single Price - Modern Clean
                    <div className="flex flex-col items-end justify-center h-full text-right pr-2">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                            ราคา
                        </span>
                        <div className="flex items-baseline">
                            <span className={`text-3xl font-bold ${theme.text} tracking-tight leading-none`}>
                                {product.prices[0].price.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-400 ml-1 font-medium">.-</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">
                            / {product.prices[0].unit || product.unit || 'ชิ้น'}
                        </span>
                    </div>
                ) : (
                    // Multiple Prices - Colorful Grid
                    <div
                        className="grid h-full gap-1 content-center"
                        style={{
                            gridTemplateColumns: product.prices.length > 2 ? 'repeat(2, 1fr)' : '1fr',
                            gridTemplateRows: `repeat(${Math.ceil(product.prices.slice(0, 6).length / (product.prices.length > 2 ? 2 : 1))}, 1fr)`,
                        }}
                    >
                        {product.prices.slice(0, 6).map((p, i) => {
                            // Use the vivid color palette for prices
                            const colors = [
                                'bg-blue-50 text-blue-700 border-blue-100',
                                'bg-emerald-50 text-emerald-700 border-emerald-100',
                                'bg-amber-50 text-amber-700 border-amber-100',
                                'bg-rose-50 text-rose-700 border-rose-100',
                                'bg-violet-50 text-violet-700 border-violet-100',
                                'bg-cyan-50 text-cyan-700 border-cyan-100'
                            ];
                            const colorClass = colors[i % colors.length];
                            // Dynamic font size adjustment based on price length
                            const priceLen = p.price.toString().length;
                            const priceTextSize = priceLen > 5 ? 'text-xs' : 'text-sm';

                            return (
                                <div
                                    key={i}
                                    className={`${colorClass} rounded border px-1 flex flex-row items-center justify-between`}
                                    style={{ minHeight: '0' }} // Allow shrinking
                                >
                                    <div className="text-[12px] font-semibold opacity-80 leading-none truncate pr-1">
                                        {p.quantity} {p.unit || product.unit || 'ชิ้น'}
                                    </div>
                                    <div className={`${priceTextSize} font-bold leading-none`}>
                                        {p.price.toLocaleString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Label;
