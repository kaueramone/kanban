'use client';

import { useState, ReactNode } from 'react';

interface ConfirmOptions {
    title: string;
    message: string;
}

let confirmResolve: ((v: boolean) => void) | null = null;

export function useConfirm() {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);

    const confirm = (title: string, message: string): Promise<boolean> => {
        setOptions({ title, message });
        return new Promise(resolve => { confirmResolve = resolve; });
    };

    const handleConfirm = (v: boolean) => {
        setOptions(null);
        confirmResolve?.(v);
        confirmResolve = null;
    };

    const ConfirmDialog = () => options ? (
        <div className="confirm-overlay" onClick={() => handleConfirm(false)}>
            <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
                <h3>{options.title}</h3>
                <p>{options.message}</p>
                <div className="confirm-actions">
                    <button className="btn btn-secondary" onClick={() => handleConfirm(false)}>Cancelar</button>
                    <button className="btn btn-danger" onClick={() => handleConfirm(true)}>Confirmar</button>
                </div>
            </div>
        </div>
    ) : null;

    return { confirm, ConfirmDialog };
}

export function Modal({ title, onClose, children, large }: { title: string; onClose: () => void; children: ReactNode; large?: boolean }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal ${large ? 'modal-lg' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}

export function ColorPicker({ value, onChange, colors }: { value: string; onChange: (c: string) => void; colors: string[] }) {
    return (
        <div className="color-picker">
            {colors.map(c => (
                <div key={c} className={`color-option ${c === value ? 'selected' : ''}`}
                    style={{ background: c }} onClick={() => onChange(c)} />
            ))}
        </div>
    );
}
