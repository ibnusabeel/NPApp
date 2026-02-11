import React from 'react';
import { IProduct } from '@/types';
import { getPriceCardColor } from '@/lib/colors';

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
    let nameFontSize = 18;
    if (nameLength > 25) nameFontSize = 16;
    if (nameLength > 35) nameFontSize = 14;
    if (nameLength > 45) nameFontSize = 12;

    return (
        <div
            className="relative overflow-hidden bg-white flex flex-col border border-gray-300"
            style={{
                width: `${width}cm`,
                height: `${height}cm`,
                transform: scale !== 1 ? `scale(${scale})` : undefined,
                transformOrigin: 'top left',
                fontFamily: "'IBM Plex Sans Thai Looped', sans-serif",
            }}
        >
            {/* Header */}
            <div
                className="flex items-center px-3 bg-slate-800 text-white overflow-hidden shrink-0"
                style={{ height: '30%' }}
            >
                <h3
                    className="font-bold leading-none w-full text-center whitespace-nowrap"
                    style={{ fontSize: `${nameFontSize}px` }}
                >
                    {product.name}
                </h3>
            </div>

            <div className="flex-1 flex flex-row min-h-0">
                {/* Info Column */}
                <div
                    className="flex flex-col justify-center px-2 bg-gray-50 border-r border-gray-200"
                    style={{ width: '30%', minWidth: '30%' }}
                >
                    <div className="text-gray-500 font-mono text-[10px] text-center mb-1 truncate">
                        {product.code}
                    </div>
                    <div className="text-gray-900 text-[11px] font-semibold text-center leading-tight">
                        {product.packing} {product.unit || 'ชิ้น'}
                    </div>
                </div>

                {/* Price Column */}
                <div className="flex-1 p-1.5 flex flex-col justify-center min-w-0 bg-white">
                    {isSinglePrice ? (
                        // Single Price - Large Card
                        <div className="h-full w-full flex items-center justify-center bg-orange-500 text-white rounded-lg shadow-sm border-2 border-orange-600 print:border-orange-600">
                            <div className="text-center">
                                <span className="block text-xs font-medium text-orange-100 mb-1">
                                    ราคา / {product.prices[0].unit || product.unit || 'ชิ้น'}
                                </span>
                                <span className="block text-3xl font-bold leading-none tracking-tight">
                                    {product.prices[0].price.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ) : (
                        // Multiple Prices - Grid
                        <div
                            className="grid h-full gap-1"
                            style={{
                                gridTemplateColumns: product.prices.length > 2 ? 'repeat(2, 1fr)' : '1fr',
                                gridTemplateRows: product.prices.length > 4 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                                alignContent: 'stretch',
                            }}
                        >
                            {product.prices.slice(0, 6).map((p, i) => {
                                const color = getPriceCardColor(i);
                                return (
                                    <div
                                        key={i}
                                        className={`${color.bg} ${color.text} rounded flex items-center justify-between px-2 border ${color.border}`}
                                    >
                                        <div className={`text-[10px] ${color.subtext} font-medium leading-none`}>
                                            {p.quantity} {p.unit || product.unit || 'ชิ้น'}
                                        </div>
                                        <div className="text-sm font-bold leading-none">
                                            {p.price.toLocaleString()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Label;
