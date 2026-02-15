import { IProduct } from "@/types";

export const exportToCSV = (products: IProduct[], filename: string = 'products.csv') => {
    // 1. Find max number of price tiers
    const maxPrices = products.reduce((max, p) => Math.max(max, p.prices.length), 0);

    // 2. Define standard columns header (Thai)
    const baseHeaders = [
        "รหัสสินค้า",
        "ชื่อสินค้า",
        "หมวดหมู่",
        "ขนาดบรรจุ",
        "หน่วย",
        "กว้าง (ซม.)",
        "สูง (ซม.)",
    ];

    // 3. Add dynamic price headers
    const priceHeaders: string[] = [];
    for (let i = 0; i < maxPrices; i++) {
        priceHeaders.push(`จำนวน ${i + 1}`);
        priceHeaders.push(`ราคา ${i + 1}`);
    }

    const headers = [...baseHeaders, ...priceHeaders, "วันที่สร้าง"];

    // 4. Map data to rows
    const rows = products.map(product => {
        // Base data
        const baseData = [
            `"${product.code.replace(/"/g, '""')}"`,
            `"${product.name.replace(/"/g, '""')}"`,
            `"${product.category || ''}"`,
            `"${product.packing}"`,
            `"${product.unit}"`,
            product.labelWidth,
            product.labelHeight,
        ];

        // Price data
        const priceData: (string | number)[] = [];
        for (let i = 0; i < maxPrices; i++) {
            const price = product.prices[i];
            if (price) {
                priceData.push(price.quantity);
                priceData.push(price.price);
            } else {
                priceData.push(""); // Empty quantity
                priceData.push(""); // Empty price
            }
        }

        // Format date
        const dateString = product.createdAt
            ? new Date(product.createdAt).toLocaleDateString('th-TH')
            : '-';

        return [...baseData, ...priceData, `"${dateString}"`].join(",");
    });

    // 3. Combine header and rows
    const csvContent = [headers.join(","), ...rows].join("\n");

    // 4. Add BOM for Excel to read UTF-8 correctly (Essential for Thai)
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

    // 5. Create download link
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
