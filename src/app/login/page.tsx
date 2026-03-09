'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        if (username === 'kaueramone' && password === 'Ramone@2013') {
            // In a real app this would be a secure HTTP-only cookie set via Server Action.
            // Since this is a simple admin gate and Vercel edge runtime supports standard document cookies:
            document.cookie = "kanban_admin_session=true; path=/; max-age=86400; samesite=strict";
            toast('Login efetuado com sucesso!', 'success');
            router.push('/admin');
        } else {
            toast('Usuário ou senha incorretos.', 'error');
            setLoading(false);
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32" style={{ color: 'var(--primary)' }}><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
                    <h1 style={{ marginTop: 16, marginBottom: 8, fontSize: 24, fontWeight: 700 }}>Kanban Pro Admin</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Área restrita. Faça login para gerenciar.</p>
                </div>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Usuário</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginTop: 16 }}>
                        <label>Senha</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 24, height: 44, fontSize: 16 }} disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
                <button onClick={() => router.push('/')} style={{ marginTop: 20, width: '100%', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
                    Voltar para o Dashboard Público
                </button>
            </div>

            <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-center;
          justify-content: center;
          background: var(--bg-body);
          padding: 24px;
        }
        .login-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }
      `}</style>
        </div>
    );
}
