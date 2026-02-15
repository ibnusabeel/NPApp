'use client';

import React, { useState, useCallback } from 'react';
import { Calculator, RotateCcw, RefreshCcw, History, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

interface CalculationResult {
    sellingPrice: number;
    profitAmount: number;
    grossMargin: number;
    markup: number;
}

interface HistoryItem {
    id: string;
    timestamp: Date;
    cost: number;
    profitPercent: number;
    sellingPrice: number;
}

function formatNumber(num: number): string {
    return new Intl.NumberFormat('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
}

export default function CalculatorPage() {
    const [cost, setCost] = useState<string>('');
    const [profitPercent, setProfitPercent] = useState<string>('');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [result, setResult] = useState<CalculationResult>({
        sellingPrice: 0,
        profitAmount: 0,
        grossMargin: 0,
        markup: 0,
    });

    const calculate = useCallback((costValue: number, profitValue: number): CalculationResult => {
        if (profitValue >= 100) {
            profitValue = 99.99;
        }

        if (costValue <= 0 || profitValue < 0) {
            return { sellingPrice: 0, profitAmount: 0, grossMargin: 0, markup: 0 };
        }

        const sellingPrice = (costValue * 100) / (100 - profitValue);
        const profitAmount = sellingPrice - costValue;
        const grossMargin = (profitAmount / sellingPrice) * 100;
        const markup = ((sellingPrice - costValue) / costValue) * 100;

        return { sellingPrice, profitAmount, grossMargin, markup };
    }, []);

    const handleCostChange = (value: string) => {
        setCost(value);
        const costNum = parseFloat(value) || 0;
        const profitNum = parseFloat(profitPercent) || 0;
        setResult(calculate(costNum, profitNum));
    };

    const handleProfitChange = (value: string) => {
        let profitNum = parseFloat(value) || 0;
        if (profitNum >= 100) {
            value = '99.99';
            profitNum = 99.99;
        }
        setProfitPercent(value);
        const costNum = parseFloat(cost) || 0;
        setResult(calculate(costNum, profitNum));
    };

    const resetCalculator = () => {
        setCost('');
        setProfitPercent('');
        setResult({ sellingPrice: 0, profitAmount: 0, grossMargin: 0, markup: 0 });
    };

    const handleNewCalculation = () => {
        if (result.sellingPrice <= 0) return;

        const newItem: HistoryItem = {
            id: Date.now().toString(),
            timestamp: new Date(),
            cost: parseFloat(cost) || 0,
            profitPercent: parseFloat(profitPercent) || 0,
            sellingPrice: result.sellingPrice,
        };

        setHistory(prev => [newItem, ...prev]);
        resetCalculator();
    };

    const deleteHistoryItem = (id: string) => {
        setHistory(history.filter(item => item.id !== id));
    };

    const clearHistory = () => {
        if (confirm('คุณต้องการลบประวัติทั้งหมดหรือไม่?')) {
            setHistory([]);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            <Sidebar />

            <main className="flex-1 w-full md:ml-64 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/25">
                            <Calculator className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground">คำนวณราคาขาย</h1>
                            <p className="text-muted-foreground mt-1">คำนวณราคาและกำไรที่ต้องการได้อย่างแม่นยำ</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                        {/* Calculator */}
                        <div className="card p-6 md:p-8 border-t-4 border-t-primary">
                            <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
                                <span className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <Calculator className="w-5 h-5" />
                                </span>
                                เครื่องคำนวณ
                            </h2>

                            <div className="space-y-6">


                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            ต้นทุน (บาท)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="input h-14 text-xl font-medium pl-4"
                                                placeholder="0.00"
                                                value={cost}
                                                onChange={(e) => handleCostChange(e.target.value)}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">บาท</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            กำไรที่ต้องการ (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="input h-14 text-xl font-medium pl-4"
                                                placeholder="0"
                                                max={99.99}
                                                value={profitPercent}
                                                onChange={(e) => handleProfitChange(e.target.value)}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Results Grid */}
                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <div className="bg-gradient-to-br from-primary/10 to-indigo-50 dark:from-primary/20 dark:to-indigo-900/20 rounded-2xl p-5 border border-primary/10">
                                        <div className="text-sm font-medium text-muted-foreground mb-1">ราคาขาย</div>
                                        <div className="text-3xl font-bold text-primary flex items-baseline gap-1">
                                            {formatNumber(result.sellingPrice)} <span className="text-base font-normal opacity-70">บ.</span>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-800">
                                        <div className="text-sm font-medium text-emerald-600/80 dark:text-emerald-400 mb-1">กำไรต่อชิ้น</div>
                                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 flex items-baseline gap-1">
                                            +{formatNumber(result.profitAmount)} <span className="text-base font-normal opacity-70">บ.</span>
                                        </div>
                                    </div>
                                    <div className="bg-secondary/50 rounded-2xl p-4">
                                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">กำไรขั้นต้น</div>
                                        <div className="text-xl font-semibold text-foreground">
                                            {formatNumber(result.grossMargin)}%
                                        </div>
                                    </div>
                                    <div className="bg-secondary/50 rounded-2xl p-4">
                                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Markup</div>
                                        <div className="text-xl font-semibold text-foreground">
                                            {formatNumber(result.markup)}%
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-8 pt-4 border-t border-border">
                                    <button
                                        onClick={handleNewCalculation}
                                        disabled={result.sellingPrice <= 0}
                                        className="btn btn-primary h-12 w-full gap-2 shadow-lg shadow-primary/20 disabled:shadow-none disabled:opacity-50 text-lg"
                                    >
                                        <RefreshCcw className="w-5 h-5" /> คำนวณใหม่
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* History */}
                        <div className="card p-6 md:p-8 flex flex-col h-full border-t-4 border-t-indigo-500">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-bold text-xl flex items-center gap-2">
                                    <span className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                                        <History className="w-5 h-5" />
                                    </span>
                                    ประวัติการคำนวณ ({history.length})
                                </h2>
                                {history.length > 0 && (
                                    <button
                                        onClick={clearHistory}
                                        className="btn btn-secondary text-xs gap-1.5 h-9 px-3 text-red-500 hover:bg-red-50 hover:border-red-200"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> ล้างประวัติ
                                    </button>
                                )}
                            </div>

                            {history.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-2xl bg-secondary/20">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <History className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="font-medium">ยังไม่มีประวัติการคำนวณ</p>
                                    <p className="text-sm mt-1">กด "คำนวณใหม่" เพื่อบันทึกผลลัพธ์</p>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col">
                                    <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-3 max-h-[500px]">
                                        {history.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="group flex items-start justify-between bg-white dark:bg-slate-800 border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all"
                                            >
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-mono text-muted-foreground">
                                                            {item.timestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                                            ทุน {formatNumber(item.cost)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                                            กำไร {item.profitPercent}%
                                                        </span>
                                                    </div>
                                                    <div className="font-bold text-lg text-foreground">
                                                        {formatNumber(item.sellingPrice)} บาท
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <button
                                                        onClick={() => deleteHistoryItem(item.id)}
                                                        className="text-muted-foreground hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
