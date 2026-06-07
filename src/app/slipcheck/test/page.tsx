"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
    LayoutDashboard,
    Receipt,
    Users,
    FileText,
    MessageCircle,
    FlaskConical,
    Upload,
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
} from "lucide-react";

const subNav = [
    { href: "/slipcheck", icon: LayoutDashboard, label: "ภาพรวม" },
    { href: "/slipcheck/slips", icon: Receipt, label: "สลิป" },
    { href: "/slipcheck/customers", icon: Users, label: "ลูกค้า" },
    { href: "/slipcheck/invoices", icon: FileText, label: "ใบแจ้งหนี้" },
    { href: "/slipcheck/line-members", icon: MessageCircle, label: "LINE" },
    { href: "/slipcheck/test", icon: FlaskConical, label: "ทดสอบ" },
];

interface TestResult {
    mode: string;
    slipok?: {
        success?: boolean;
        code?: number;
        message?: string;
        amount?: number;
        date?: string;
        time?: string;
        sender?: string;
        receiver?: string;
        transRef?: string;
    };
    qr?: {
        sendingBank?: string;
        bankName?: string;
        transRef?: string;
        verified?: boolean;
    };
    message?: string;
    error?: string;
}

export default function TestPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TestResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;

        setFile(f);
        setResult(null);
        setError(null);

        const reader = new FileReader();
        reader.onload = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(f);
    };

    const handleVerify = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const base64 = preview!.split(",")[1];
            const mime = file.type || "image/jpeg";

            const res = await fetch("/api/webhook/test/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: `data:${mime};base64,${base64}`, mime }),
            });

            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };

    const handleQrOnly = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const base64 = preview!.split(",")[1];
            const mime = file.type || "image/jpeg";

            const res = await fetch("/api/webhook/test/qr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: `data:${mime};base64,${base64}`, mime }),
            });

            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
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
                                    item.href === "/slipcheck/test"
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

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">ทดสอบตรวจสอบสลิป</h1>
                <p className="text-sm text-muted-foreground mb-8">
                    อัปโหลดรูปสลิปเพื่อทดสอบการตรวจสอบ (SlipOK + QR fallback)
                </p>

                {/* Upload area */}
                <div
                    onClick={() => fileRef.current?.click()}
                    className="card border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors p-12 mb-6 text-center"
                >
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    {preview ? (
                        <img src={preview} alt="preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                    ) : (
                        <>
                            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">คลิกเพื่อเลือกรูปสลิป</p>
                            <p className="text-xs text-muted-foreground mt-2">รองรับ JPG, PNG, WebP</p>
                        </>
                    )}
                </div>

                {file && (
                    <div className="flex gap-3 mb-6">
                        <button
                            onClick={handleVerify}
                            disabled={loading}
                            className="btn btn-primary flex-1 gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            ตรวจสอบเต็มรูปแบบ
                        </button>
                        <button
                            onClick={handleQrOnly}
                            disabled={loading}
                            className="btn btn-secondary flex-1 gap-2"
                        >
                            อ่าน QR อย่างเดียว
                        </button>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="card p-4 mb-6 border-red-200 bg-red-50 dark:bg-red-950">
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="card p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            {result.mode === "slipok" && result.slipok?.success && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            )}
                            {result.mode === "qr" && <AlertCircle className="w-5 h-5 text-amber-500" />}
                            {result.mode === "qr-only" && <AlertCircle className="w-5 h-5 text-blue-500" />}
                            {(result.mode === "silent" || result.mode === "error" || (result.mode === "slipok" && !result.slipok?.success)) && (
                                <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            ผลลัพธ์: {result.mode}
                        </h3>

                        <div className="space-y-2 text-sm">
                            {result.message && (
                                <div className="bg-muted p-3 rounded-lg">
                                    <span className="text-muted-foreground">Message: </span>
                                    {result.message}
                                </div>
                            )}

                            {result.slipok && (
                                <div className="border border-border rounded-lg p-4">
                                    <h4 className="font-medium mb-2">SlipOK Result</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <span className="text-muted-foreground">Success:</span>
                                        <span>{String(result.slipok.success)}</span>
                                        {result.slipok.code !== undefined && (
                                            <>
                                                <span className="text-muted-foreground">Code:</span>
                                                <span>{result.slipok.code}</span>
                                            </>
                                        )}
                                        {result.slipok.message && (
                                            <>
                                                <span className="text-muted-foreground">Message:</span>
                                                <span className="truncate">{result.slipok.message}</span>
                                            </>
                                        )}
                                        {result.slipok.amount && (
                                            <>
                                                <span className="text-muted-foreground">Amount:</span>
                                                <span>฿{result.slipok.amount}</span>
                                            </>
                                        )}
                                        {result.slipok.transRef && (
                                            <>
                                                <span className="text-muted-foreground">Ref:</span>
                                                <span className="font-mono">{result.slipok.transRef}</span>
                                            </>
                                        )}
                                        {result.slipok.sender && (
                                            <>
                                                <span className="text-muted-foreground">Sender:</span>
                                                <span>{result.slipok.sender}</span>
                                            </>
                                        )}
                                        {result.slipok.receiver && (
                                            <>
                                                <span className="text-muted-foreground">Receiver:</span>
                                                <span>{result.slipok.receiver}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {result.qr && (
                                <div className="border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50 dark:bg-amber-950">
                                    <h4 className="font-medium mb-2 text-amber-700 dark:text-amber-300">QR Fallback Result</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <span className="text-muted-foreground">Bank:</span>
                                        <span>{result.qr.bankName || result.qr.sendingBank || "-"}</span>
                                        {result.qr.transRef && (
                                            <>
                                                <span className="text-muted-foreground">Ref:</span>
                                                <span className="font-mono">{result.qr.transRef}</span>
                                            </>
                                        )}
                                        <span className="text-muted-foreground">Verified:</span>
                                        <span>{String(result.qr.verified ?? false)}</span>
                                    </div>
                                </div>
                            )}

                            {result.error && (
                                <div className="bg-red-50 dark:bg-red-950 text-red-600 p-3 rounded-lg text-xs">
                                    {result.error}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
