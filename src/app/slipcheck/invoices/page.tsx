"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    LayoutDashboard,
    Receipt,
    Users,
    FileText,
    MessageCircle,
    FlaskConical,
    Search,
    ChevronLeft,
    ChevronRight,
    Plus,
    Check,
    X,
    Loader2,
} from "lucide-react";
import { listInvoices, createInvoice } from "../actions";
import { IInvoice } from "@/types";

const subNav = [
    { href: "/slipcheck", icon: LayoutDashboard, label: "ภาพรวม" },
    { href: "/slipcheck/slips", icon: Receipt, label: "สลิป" },
    { href: "/slipcheck/customers", icon: Users, label: "ลูกค้า" },
    { href: "/slipcheck/invoices", icon: FileText, label: "ใบแจ้งหนี้" },
    { href: "/slipcheck/line-members", icon: MessageCircle, label: "LINE" },
    { href: "/slipcheck/test", icon: FlaskConical, label: "ทดสอบ" },
];

function formatMoney(n: number): string {
    return new Intl.NumberFormat("th-TH").format(n);
}

const STATUS_LABELS: Record<string, string> = {
    pending: "รอชำระ",
    partial: "ชำระบางส่วน",
    paid: "ชำระแล้ว",
};

const STATUS_CLASSES: Record<string, string> = {
    pending: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    partial: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
};

export default function InvoicesPage() {
    const [items, setItems] = useState<IInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [error, setError] = useState("");

    const [formCode, setFormCode] = useState("");
    const [formInvoiceNo, setFormInvoiceNo] = useState("");
    const [formAmount, setFormAmount] = useState("");
    const [formDueDate, setFormDueDate] = useState("");
    const [formNote, setFormNote] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const result = await listInvoices({
                page,
                limit: 20,
                search: search || undefined,
                status: filterStatus || undefined,
            });
            setItems(result.items);
            setTotal(result.total);
            setPages(result.pages);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [page, search, filterStatus]);

    useEffect(() => { load(); }, [load]);

    const handleAdd = async () => {
        setError("");
        try {
            await createInvoice({
                customerCode: formCode,
                invoiceNo: formInvoiceNo || undefined,
                amount: Number(formAmount),
                dueDate: formDueDate || undefined,
                note: formNote || undefined,
            });
            setShowAdd(false);
            setFormCode("");
            setFormInvoiceNo("");
            setFormAmount("");
            setFormDueDate("");
            setFormNote("");
            load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <nav className="flex gap-1 overflow-x-auto -mb-px">
                        {subNav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    item.href === "/slipcheck/invoices"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">ใบแจ้งหนี้</h1>
                        <p className="text-sm text-muted-foreground mt-1">ทั้งหมด {total} รายการ</p>
                    </div>
                    <button
                        onClick={() => { setShowAdd(true); setError(""); }}
                        className="btn btn-primary text-sm gap-2"
                    >
                        <Plus className="w-4 h-4" /> ออกใบแจ้งหนี้
                    </button>
                </div>

                {/* Filters */}
                <div className="card p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="ค้นหาเลขที่, ชื่อ, รหัสลูกค้า..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="input pl-10 py-2 text-sm w-full"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                            className="input py-2 text-sm"
                        >
                            <option value="">ทุกสถานะ</option>
                            <option value="pending">รอชำระ</option>
                            <option value="partial">ชำระบางส่วน</option>
                            <option value="paid">ชำระแล้ว</option>
                        </select>
                        <button onClick={load} className="btn btn-secondary text-sm">ค้นหา</button>
                    </div>
                </div>

                {/* Add Modal */}
                {showAdd && (
                    <div className="card p-6 mb-6 border-2 border-primary/20">
                        <h3 className="font-semibold mb-4">ออกใบแจ้งหนี้ใหม่</h3>
                        {error && (
                            <div className="bg-red-50 dark:bg-red-950 text-red-600 text-sm p-3 rounded-lg mb-4">
                                {error}
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">รหัสลูกค้า *</label>
                                <input
                                    type="text"
                                    value={formCode}
                                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                                    className="input py-2 text-sm w-full"
                                    placeholder="C001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">เลขที่ใบแจ้งหนี้</label>
                                <input
                                    type="text"
                                    value={formInvoiceNo}
                                    onChange={(e) => setFormInvoiceNo(e.target.value)}
                                    className="input py-2 text-sm w-full"
                                    placeholder="เว้นว่าง = สร้างอัตโนมัติ"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">จำนวนเงิน *</label>
                                <input
                                    type="number"
                                    value={formAmount}
                                    onChange={(e) => setFormAmount(e.target.value)}
                                    className="input py-2 text-sm w-full"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">วันที่ครบกำหนด</label>
                                <input
                                    type="date"
                                    value={formDueDate}
                                    onChange={(e) => setFormDueDate(e.target.value)}
                                    className="input py-2 text-sm w-full"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-foreground mb-1">หมายเหตุ</label>
                                <input
                                    type="text"
                                    value={formNote}
                                    onChange={(e) => setFormNote(e.target.value)}
                                    className="input py-2 text-sm w-full"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowAdd(false)}
                                className="btn btn-secondary text-sm gap-1"
                            >
                                <X className="w-4 h-4" /> ยกเลิก
                            </button>
                            <button onClick={handleAdd} className="btn btn-primary text-sm gap-1">
                                <Check className="w-4 h-4" /> ออกใบแจ้งหนี้
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground text-sm">ไม่พบใบแจ้งหนี้</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/50">
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">เลขที่</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">ลูกค้า</th>
                                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">จำนวน</th>
                                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">ชำระแล้ว</th>
                                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">คงค้าง</th>
                                            <th className="text-center px-4 py-3 font-medium text-muted-foreground">สถานะ</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">ครบกำหนด</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {items.map((inv) => (
                                            <tr key={inv._id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNo}</td>
                                                <td className="px-4 py-3">
                                                    <span className="font-medium">{inv.customerName}</span>
                                                    <span className="text-muted-foreground ml-1 text-xs">({inv.customerCode})</span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    ฿{formatMoney(inv.amount)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    ฿{formatMoney(inv.paidAmount)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold">
                                                    <span className={inv.remaining && inv.remaining > 0 ? "text-red-600" : "text-emerald-600"}>
                                                        ฿{formatMoney(inv.remaining || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CLASSES[inv.status] || ""}`}>
                                                        {STATUS_LABELS[inv.status] || inv.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {inv.dueDate
                                                        ? new Date(inv.dueDate).toLocaleDateString("th-TH")
                                                        : "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                                <span className="text-sm text-muted-foreground">หน้า {page} / {pages}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        className="btn btn-secondary text-sm py-1.5 disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(pages, p + 1))}
                                        disabled={page >= pages}
                                        className="btn btn-secondary text-sm py-1.5 disabled:opacity-50"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
