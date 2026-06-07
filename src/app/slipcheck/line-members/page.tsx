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
    Loader2,
    AlertCircle,
    RefreshCw,
} from "lucide-react";
import { listLineFollowers, listRecentLineUsers } from "../actions";
import { ILineFollower } from "@/types";

const subNav = [
    { href: "/slipcheck", icon: LayoutDashboard, label: "ภาพรวม" },
    { href: "/slipcheck/slips", icon: Receipt, label: "สลิป" },
    { href: "/slipcheck/customers", icon: Users, label: "ลูกค้า" },
    { href: "/slipcheck/invoices", icon: FileText, label: "ใบแจ้งหนี้" },
    { href: "/slipcheck/line-members", icon: MessageCircle, label: "LINE" },
    { href: "/slipcheck/test", icon: FlaskConical, label: "ทดสอบ" },
];

type Tab = "followers" | "recent";

export default function LineMembersPage() {
    const [tab, setTab] = useState<Tab>("followers");
    const [items, setItems] = useState<ILineFollower[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextToken, setNextToken] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [source, setSource] = useState("");

    const loadFollowers = useCallback(async (start?: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await listLineFollowers({ start, limit: 30, search: search || undefined });
            if (result.error) {
                setError(result.error);
            }
            setItems(result.items);
            setNextToken(result.next);
            setSource(result.source);
        } catch {
            setError("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setLoading(false);
        }
    }, [search]);

    const loadRecent = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await listRecentLineUsers({ limit: 30, search: search || undefined });
            if (result.error) {
                setError(result.error);
            }
            setItems(result.items);
            setNextToken(null);
            setSource(result.source);
        } catch {
            setError("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        if (tab === "followers") {
            loadFollowers();
        } else {
            loadRecent();
        }
    }, [tab, loadFollowers, loadRecent]);

    const handleNext = () => {
        if (nextToken && tab === "followers") {
            loadFollowers(nextToken);
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
                                    item.href === "/slipcheck/line-members"
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
                        <h1 className="text-2xl font-bold text-foreground">LINE Members</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {source === "followers" ? "LINE Followers" : "ผู้ใช้ล่าสุดจากสลิป"} · {items.length} คน
                        </p>
                    </div>
                    <button
                        onClick={() => (tab === "followers" ? loadFollowers() : loadRecent())}
                        className="btn btn-secondary text-sm gap-2"
                    >
                        <RefreshCw className="w-4 h-4" /> โหลดใหม่
                    </button>
                </div>

                {/* Tab selector */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setTab("followers")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            tab === "followers"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                        LINE Followers
                    </button>
                    <button
                        onClick={() => setTab("recent")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            tab === "recent"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                        ผู้ใช้ล่าสุด
                    </button>
                </div>

                {/* Search */}
                <div className="card p-4 mb-6">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อ, User ID, รหัสลูกค้า..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input pl-10 py-2 text-sm w-full"
                            />
                        </div>
                        <button onClick={() => (tab === "followers" ? loadFollowers() : loadRecent())} className="btn btn-secondary text-sm">
                            ค้นหา
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="card p-4 mb-6 border-red-200 bg-red-50 dark:bg-red-950">
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground text-sm">
                            {tab === "followers" ? "ไม่พบ followers หรือ token หมดอายุ" : "ยังไม่มีผู้ใช้"}
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-border">
                                {items.map((item) => (
                                    <div key={item.userId} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {item.pictureUrl ? (
                                                    <img
                                                        src={item.pictureUrl}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {item.displayName || item.userId}
                                                </p>
                                                <p className="text-xs text-muted-foreground font-mono truncate">
                                                    {item.userId}
                                                </p>
                                                {item.slipCount && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {item.slipCount} สลิป
                                                        {item.lastAt
                                                            ? ` · ล่าสุด ${new Date(item.lastAt).toLocaleDateString("th-TH")}`
                                                            : ""}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-4">
                                            {item.linkedCustomerCode ? (
                                                <div>
                                                    <span className="text-sm font-medium text-emerald-600">
                                                        {item.linkedCustomerCode}
                                                    </span>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.linkedCustomerName}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">ยังไม่ผูก</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {nextToken && tab === "followers" && (
                                <div className="flex justify-center p-4 border-t border-border">
                                    <button onClick={handleNext} className="btn btn-secondary text-sm gap-2">
                                        <ChevronRight className="w-4 h-4" /> โหลดเพิ่มเติม
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
