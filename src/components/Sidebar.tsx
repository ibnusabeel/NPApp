'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Tag,
    Home,
    Settings,
    Plus,
    Moon,
    Sun,
    Printer,
    FolderOpen,
    Search,
    Calculator,
    Menu,
    X
} from 'lucide-react';

interface SidebarProps {
    onNewProduct?: () => void;
}

export default function Sidebar({ onNewProduct }: SidebarProps) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Prevent hydration mismatch by only rendering theme-dependent UI after mount
    useEffect(() => {
        setMounted(true);
        // Check for saved theme preference or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        if (newIsDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const navItems = [
        { href: '/', icon: Home, label: 'หน้าหลัก' },
        { href: '/calculator', icon: Calculator, label: 'คำนวณราคา' },
        { href: '/categories', icon: FolderOpen, label: 'หมวดหมู่' },
        { href: '/print', icon: Printer, label: 'พิมพ์ป้ายราคา' },
        { href: '/settings', icon: Settings, label: 'ตั้งค่า' },
    ];

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl shadow-sm border border-border md:hidden"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Backdrop for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out
          md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                {/* Logo */}
                <div className="p-6 border-b border-border/50">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Tag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-xl text-foreground tracking-tight block">
                                NP Label
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">
                                Nara Packing
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="p-4 pb-2">
                    <button
                        onClick={() => {
                            onNewProduct?.();
                            setIsOpen(false);
                        }}
                        className="w-full btn btn-primary gap-2 py-3 shadow-lg shadow-indigo-500/20 group"
                    >
                        <div className="bg-white/20 p-1 rounded-full group-hover:scale-110 transition-transform">
                            <Plus className="w-4 h-4" />
                        </div>
                        เพิ่มสินค้าใหม่
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 py-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            className="input pl-10 py-2.5 text-sm bg-secondary/50 border-transparent focus:bg-background"
                        />
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
                    <div className="text-xs font-semibold text-muted-foreground mb-2 px-3 mt-2 uppercase tracking-wider">
                        เมนูหลัก
                    </div>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                                        ? 'bg-primary/10 text-primary shadow-sm'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground hover:pl-4'
                                    }
                `}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-border/50 space-y-2 bg-secondary/30">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-white dark:hover:bg-slate-800 shadow-sm border border-transparent hover:border-border transition-all"
                    >
                        <span className="flex items-center gap-3">
                            {mounted ? (
                                isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />
                            ) : (
                                <Moon className="w-4 h-4" />
                            )}
                            {mounted ? (isDark ? 'โหมดสว่าง' : 'โหมดมืด') : 'โหมดมืด'}
                        </span>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>
                </div>
            </aside>
        </>
    );
}
