import React from 'react';
import Label from '@/components/Label';
import PrintHeader from '@/components/PrintHeader';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { IProduct } from '@/types';

export const dynamic = 'force-dynamic';

interface PrintPageProps {
  searchParams: Promise<{
    ids?: string;
  }>;
}

async function getProductsByIds(ids: string[]): Promise<IProduct[]> {
  await dbConnect();
  const products = await Product.find({ _id: { $in: ids } }).lean();
  return products.map((p: any) => ({
    ...p,
    _id: p._id.toString(),
    createdAt: p.createdAt?.toISOString(),
    updatedAt: p.updatedAt?.toISOString(),
  }));
}

export default async function PrintPage({ searchParams }: PrintPageProps) {
  const params = await searchParams;
  const ids = params.ids ? params.ids.split(',') : [];
  const products = await getProductsByIds(ids);

  return (
    <div className="min-h-screen bg-muted print:bg-white text-foreground">
      <PrintHeader count={products.length} />

      {/* A4 Page Container - 2 columns, no gaps for easy cutting */}
      <div
        className="mx-auto bg-white shadow-xl print:shadow-none print:m-0 overflow-hidden box-border my-8 print:my-0"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '0',
        }}
      >
        <style>{`
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
              font-family: 'IBM Plex Sans Thai Looped', sans-serif;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
          .label-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            width: 210mm;
          }
          .label-cell {
            border: 0.5px solid #ddd;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2mm;
          }
          @media print {
            .label-cell {
              border: 0.5px solid #ccc;
            }
          }
        `}</style>

        {products.length === 0 ? (
          <div className="w-full text-center py-20 text-muted-foreground">
            <div className="text-4xl mb-4">📋</div>
            <p>ไม่มีสินค้าที่เลือก</p>
            <p className="text-sm mt-2">กรุณากลับไปเลือกสินค้าจากหน้าแดชบอร์ด</p>
          </div>
        ) : (
          <div className="label-grid">
            {products.map((product) => (
              <div key={product._id as string} className="label-cell break-inside-avoid">
                <Label product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
