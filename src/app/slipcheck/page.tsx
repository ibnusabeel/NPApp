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
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    Banknote,
    Loader2,
} from "lucide-react";
import { getDashboardOverview } from "./actions";
import { IDashboardOverview } from "@/types";

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

export default function SlipCheckDashboard() {
    const [data, setData] = useState<IDashboardOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getDashboardOverview();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="card p-8 text-center">
                <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
                <p className="text-danger font-medium">{error}</p>
                <button onClick={load} className="btn btn-primary mt-4">
                    ลองใหม่
                </button>
            </div>
        );
    }

    if (!data) return null;

    const cards = [
        {
            label: "สลิปวันนี้",
            value: data.slips.today,
            sub: `${data.slips.todaySuccess} ผ่าน`,
            icon: Receipt,
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-950",
        },
        {
            label: "ยอดเงินวันนี้",
            value: `฿${formatMoney(data.slips.todayAmount)}`,
            sub: `${data.slips.verifiedTotal} ยืนยันแล้วทั้งหมด`,
            icon: Banknote,
            color: "text-emerald-500",
            bg: "bg-emerald-50 dark:bg-emerald-950",
        },
        {
            label: "ลูกค้า",
            value: data.customers.total,
            sub: `${data.customers.linked} ผูก LINE`,
            icon: Users,
            color: "text-violet-500",
            bg: "bg-violet-50 dark:bg-violet-950",
        },
        {
            label: "ค้างชำระ",
            value: `฿${formatMoney(data.invoices.outstanding)}`,
            sub: `${data.invoices.pending} รอ + ${data.invoices.partial} บางส่วน`,
            icon: Clock,
            color: data.invoices.outstanding > 0 ? "text-amber-500" : "text-emerald-500",
            bg: data.invoices.outstanding > 0 ? "bg-amber-50 dark:bg-amber-950" : "bg-emerald-50 dark:bg-emerald-950",
        },
        {
            label: "สลิปรอจัดสรร",
            value: data.unallocatedSlips,
            sub: "ยังไม่ได้ลงใบแจ้งหนี้",
            icon: AlertCircle,
            color: data.unallocatedSlips > 0 ? "text-red-500" : "text-slate-400",
            bg: data.unallocatedSlips > 0 ? "bg-red-50 dark:bg-red-950" : "bg-slate-50 dark:bg-slate-900",
        },
        {
            label: "สถานะระบบ",
            value: (
                <span className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${data.system.mongo ? "bg-emerald-500" : "bg-red-500"}`} />
                    {data.system.qrFallback ? "QR สำรอง" : "SlipOK เท่านั้น"}
                </span>
            ),
            sub: data.system.autoCustomerOnFollow ? "Auto Customer: on" : "Auto Customer: off",
            icon: TrendingUp,
            color: "text-teal-500",
            bg: "bg-teal-50 dark:bg-teal-950",
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Sub Navigation */}
            <div className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <nav className="flex gap-1 overflow-x-auto -mb-px">
                        {subNav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    item.href === "/slipcheck"
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

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">สลิป & การเงิน</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            ภาพรวมระบบตรวจสอบสลิปและการเงิน
                        </p>
                    </div>
                    <button onClick={load} className="btn btn-secondary text-sm">
                        รีเฟรช
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {cards.map((card) => (
                        <div key={card.label} className="card p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{card.label}</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                                </div>
                                <div className={`p-2.5 rounded-xl ${card.bg}`}>
                                    <card.icon className={`w-5 h-5 ${card.color}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Slips & Pending Invoices */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Slips */}
                    <div className="card">
                        <div className="p-5 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-foreground">สลิปล่าสุด</h2>
                                <Link href="/slipcheck/slips" className="text-sm text-primary hover:underline">
                                    ดูทั้งหมด
                                </Link>
                            </div>
                        </div>
                        <div className="divide-y divide-border">
                            {data.recentSlips.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    ยังไม่มีสลิป
                                </div>
                            ) : (
                                data.recentSlips.slice(0, 5).map((slip) => (
                                    <div key={slip._id} className="p-4 flex items-center justify-between">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                {slip.success ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                ) : (
                                                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                                )}
                                                <span className="text-sm font-medium text-foreground truncate">
                                                    {slip.customerName || slip.customerCode || slip.lineUserId?.slice(-8) || "ไม่ทราบ"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 ml-6">
                                                {slip.verificationMode === "qr" ? "QR" : "SlipOK"}
                                                {slip.transRef ? ` · ${slip.transRef}` : ""}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-4">
                                            <p className="text-sm font-semibold text-foreground">
                                                {slip.amount ? `฿${formatMoney(slip.amount)}` : "-"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {slip.createdAt
                                                    ? new Date(slip.createdAt).toLocaleTimeString("th-TH", {
                                                          hour: "2-digit",
                                                          minute: "2-digit",
                                                      })
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Pending Invoices */}
                    <div className="card">
                        <div className="p-5 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-foreground">ใบแจ้งหนี้คงค้าง</h2>
                                <Link href="/slipcheck/invoices" className="text-sm text-primary hover:underline">
                                    ดูทั้งหมด
                                </Link>
                            </div>
                        </div>
                        <div className="divide-y divide-border">
                            {data.pendingInvoices.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    ไม่มีใบแจ้งหนี้คงค้าง 🎉
                                </div>
                            ) : (
                                data.pendingInvoices.slice(0, 5).map((inv) => (
                                    <div key={inv._id} className="p-4 flex items-center justify-between">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {inv.customerName || inv.customerCode}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {inv.invoiceNo}
                                                {inv.dueDate
                                                    ? ` · ครบ ${new Date(inv.dueDate).toLocaleDateString("th-TH")}`
                                                    : ""}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-4">
                                            <p className="text-sm font-semibold text-foreground">
                                                ฿{formatMoney(inv.remaining || 0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {inv.status === "partial" ? "ชำระบางส่วน" : "รอชำระ"}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
