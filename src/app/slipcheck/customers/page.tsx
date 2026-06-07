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
    Pencil,
    Loader2,
} from "lucide-react";
import { listCustomers, createCustomer, updateCustomer } from "../actions";
import { ICustomer } from "@/types";

const subNav = [
    { href: "/slipcheck", icon: LayoutDashboard, label: "ภาพรวม" },
    { href: "/slipcheck/slips", icon: Receipt, label: "สลิป" },
    { href: "/slipcheck/customers", icon: Users, label: "ลูกค้า" },
    { href: "/slipcheck/invoices", icon: FileText, label: "ใบแจ้งหนี้" },
    { href: "/slipcheck/line-members", icon: MessageCircle, label: "LINE" },
    { href: "/slipcheck/test", icon: FlaskConical, label: "ทดสอบ" },
];

export default function CustomersPage() {
    const [items, setItems] = useState<ICustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [error, setError] = useState("");

    // Form state
    const [formCode, setFormCode] = useState("");
    const [formName, setFormName] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [formLineUserId, setFormLineUserId] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const result = await listCustomers({ page, limit: 50, search: search || undefined });
            setItems(result.items);
            setTotal(result.total);
            setPages(result.pages);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { load(); }, [load]);

    const resetForm = () => {
        setFormCode("");
        setFormName("");
        setFormPhone("");
        setFormLineUserId("");
        setError("");
    };

    const handleAdd = async () => {
        setError("");
        try {
            await createCustomer({
                customerCode: formCode,
                name: formName,
                phone: formPhone,
                lineUserId: formLineUserId || undefined,
            });
            setShowAdd(false);
            resetForm();
            load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        }
    };

    const handleEdit = async (id: string) => {
        setError("");
        try {
            const data: { name?: string; phone?: string; lineUserId?: string | null } = {};
            if (formName) data.name = formName;
            if (formPhone) data.phone = formPhone;
            data.lineUserId = formLineUserId || null;
            await updateCustomer(id, data);
            setEditId(null);
            resetForm();
            load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        }
    };

    const startEdit = (c: ICustomer) => {
        setEditId(c._id || null);
        setFormName(c.name);
        setFormPhone(c.phone || "");
        setFormLineUserId(c.lineUserId || "");
        setError("");
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
                                    item.href === "/slipcheck/customers"
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
                        <h1 className="text-2xl font-bold text-foreground">ลูกค้า</h1>
                        <p className="text-sm text-muted-foreground mt-1">ทั้งหมด {total} ราย</p>
                    </div>
                    <button
                        onClick={() => { setShowAdd(true); resetForm(); }}
                        className="btn btn-primary text-sm gap-2"
                    >
                        <Plus className="w-4 h-4" /> เพิ่มลูกค้า
                    </button>
                </div>

                {/* Search */}
                <div className="card p-4 mb-6">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="ค้นหารหัส, ชื่อ, เบอร์..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="input pl-10 py-2 text-sm w-full"
                            />
                        </div>
                        <button onClick={load} className="btn btn-secondary text-sm">ค้นหา</button>
                    </div>
                </div>

                {/* Add/Edit Modal */}
                {(showAdd || editId) && (
                    <div className="card p-6 mb-6 border-2 border-primary/20">
                        <h3 className="font-semibold mb-4">{showAdd ? "เพิ่มลูกค้าใหม่" : "แก้ไขลูกค้า"}</h3>
                        {error && (
                            <div className="bg-red-50 dark:bg-red-950 text-red-600 text-sm p-3 rounded-lg mb-4">
                                {error}
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            {showAdd && (
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
                            )}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">ชื่อ *</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="input py-2 text-sm w-full"
                                    placeholder="ชื่อลูกค้า"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">เบอร์โทร</label>
                                <input
                                    type="text"
                                    value={formPhone}
                                    onChange={(e) => setFormPhone(e.target.value)}
                                    className="input py-2 text-sm w-full"
                                    placeholder="0812345678"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">LINE User ID</label>
                                <input
                                    type="text"
                                    value={formLineUserId}
                                    onChange={(e) => setFormLineUserId(e.target.value)}
                                    className="input py-2 text-sm w-full"
                                    placeholder="U..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => { setShowAdd(false); setEditId(null); resetForm(); }}
                                className="btn btn-secondary text-sm gap-1"
                            >
                                <X className="w-4 h-4" /> ยกเลิก
                            </button>
                            <button
                                onClick={showAdd ? handleAdd : () => handleEdit(editId!)}
                                className="btn btn-primary text-sm gap-1"
                            >
                                <Check className="w-4 h-4" /> {showAdd ? "เพิ่ม" : "บันทึก"}
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
                        <div className="py-16 text-center text-muted-foreground text-sm">ไม่พบลูกค้า</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/50">
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">รหัส</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">ชื่อ</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">เบอร์</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">LINE</th>
                                            <th className="text-center px-4 py-3 font-medium text-muted-foreground">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {items.map((c) => (
                                            <tr key={c._id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono font-semibold">{c.customerCode}</td>
                                                <td className="px-4 py-3">{c.name}</td>
                                                <td className="px-4 py-3">{c.phone || "-"}</td>
                                                <td className="px-4 py-3">
                                                    {c.lineUserId ? (
                                                        <span className="text-emerald-600 text-xs bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                                                            ผูกแล้ว
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => startEdit(c)}
                                                        className="btn btn-secondary text-xs py-1 gap-1"
                                                    >
                                                        <Pencil className="w-3 h-3" /> แก้ไข
                                                    </button>
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
