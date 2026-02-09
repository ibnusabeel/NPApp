'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';

interface PrintHeaderProps {
    count: number;
}

export default function PrintHeader({ count }: PrintHeaderProps) {
    return (
        <div className="print:hidden bg-card border-b border-border p-4 sticky top-0 z-20 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> กลับ
                </Link>
                <div className="h-5 w-px bg-border"></div>
                <h1 className="font-semibold text-foreground">
                    พรีวิวการพิมพ์ <span className="text-muted-foreground font-normal">({count} ป้าย)</span>
                </h1>
            </div>
            <button
                onClick={() => window.print()}
                className="btn btn-primary gap-2"
            >
                <Printer className="w-4 h-4" /> พิมพ์
            </button>
        </div>
    );
}
