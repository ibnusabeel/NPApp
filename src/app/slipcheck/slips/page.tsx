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
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    ArrowUpDown,
} from "lucide-react";
import { listSlipRecords } from "../actions";
import { ISlipRecord } from "@/types";

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

export default function SlipsPage() {
    const [items, setItems] = useState<ISlipRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState("");
    const [filterSuccess, setFilterSuccess] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const result = await listSlipRecords({
                page,
                limit: 20,
                transRef: search || undefined,
                success: filterSuccess || undefined,
                from: dateFrom || undefined,
                to: dateTo || undefined,
            });
            setItems(result.items);
            setTotal(result.total);
            setPages(result.pages);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [page, search, filterSuccess, dateFrom, dateTo]);

    useEffect(() => {
        load();
    }, [load]);

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
                                    item.href === "/slipcheck/slips"
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
                        <h1 className="text-2xl font-bold text-foreground">รายการสลิป</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            ทั้งหมด {total} รายการ
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="card p-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="ค้นหา ref..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="input pl-10 py-2 text-sm"
                            />
                        </div>
                        <select
                            value={filterSuccess}
                            onChange={(e) => { setFilterSuccess(e.target.value); setPage(1); }}
                            className="input py-2 text-sm"
                        >
                            <option value="">ทั้งหมด</option>
                            <option value="true">ผ่าน</option>
                            <option value="false">ไม่ผ่าน</option>
                        </select>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                            className="input py-2 text-sm"
                            placeholder="จากวันที่"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                            className="input py-2 text-sm"
                            placeholder="ถึงวันที่"
                        />
                        <button onClick={load} className="btn btn-secondary text-sm">
                            ค้นหา
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground text-sm">ไม่พบสลิป</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/50">
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">เวลา</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">ลูกค้า</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ref</th>
                                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">จำนวนเงิน</th>
                                            <th className="text-center px-4 py-3 font-medium text-muted-foreground">สถานะ</th>
                                            <th className="text-center px-4 py-3 font-medium text-muted-foreground">โหมด</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {items.map((slip) => (
                                            <tr key={slip._id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {slip.createdAt
                                                        ? new Date(slip.createdAt).toLocaleString("th-TH")
                                                        : "-"}
                                                </td>
                                                <td className="px-4 py-3 max-w-[200px] truncate">
                                                    {slip.customerName || slip.customerCode || slip.lineUserId?.slice(-8) || "-"}
                                                </td>
                                                <td className="px-4 py-3 max-w-[150px] truncate font-mono text-xs">
                                                    {slip.transRef || "-"}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                                                    {slip.amount ? `฿${formatMoney(slip.amount)}` : "-"}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {slip.success ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600">
                                                            <CheckCircle2 className="w-4 h-4" /> ผ่าน
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-red-500">
                                                            <XCircle className="w-4 h-4" /> ไม่ผ่าน
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                        slip.verificationMode === "slipok"
                                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                                            : slip.verificationMode === "qr"
                                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                                            : "bg-slate-100 text-slate-500"
                                                    }`}>
                                                        {slip.verificationMode === "qr" ? "QR" : "SlipOK"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                                <span className="text-sm text-muted-foreground">
                                    หน้า {page} / {pages}
                                </span>
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
