'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import { ToastProvider } from '@/components/ToastProvider';

export default function AppShell({ children, title }: { children: ReactNode; title: string }) {
    return (
        <ToastProvider>
            <div className="app-layout">
                <Sidebar />
                <main className="main">
                    <header className="topbar">
                        <div className="topbar-left">
                            <h1 className="page-title">{title}</h1>
                        </div>
                    </header>
                    <div className="content">
                        {children}
                    </div>
                </main>
            </div>
        </ToastProvider>
    );
}
