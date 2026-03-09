'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Client, STATUS_LABELS } from '@/lib/types';
import AppShell from '@/components/AppShell';
import { Modal } from '@/components/UI';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/UI';

function initials(name: string) {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Client | null>(null);
    const { toast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();

    const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', industry_name: '', avatar_url: '', notes: '', status: 'active' });

    useEffect(() => { loadClients(); }, []);

    async function loadClients() {
        const { data } = await supabase.from('kanban_clients').select('*').order('name');
        setClients(data || []);
        setLoading(false);
    }

    function openForm(client?: Client) {
        if (client) {
            setEditing(client);
            setForm({ name: client.name, email: client.email, phone: client.phone, company: client.company, industry_name: client.industry_name || '', avatar_url: client.avatar_url, notes: client.notes, status: client.status });
        } else {
            setEditing(null);
            setForm({ name: '', email: '', phone: '', company: '', industry_name: '', avatar_url: '', notes: '', status: 'active' });
        }
        setShowModal(true);
    }

    async function saveClient() {
        if (!form.name.trim()) return toast('Nome é obrigatório', 'error');
        if (editing) {
            await supabase.from('kanban_clients').update(form).eq('id', editing.id);
            toast('Cliente atualizado!');
        } else {
            await supabase.from('kanban_clients').insert(form);
            toast('Cliente criado!');
        }
        setShowModal(false);
        loadClients();
    }

    async function deleteClient(id: number) {
        if (!await confirm('Excluir Cliente', 'Tem certeza? Os projetos ficarão sem cliente.')) return;
        await supabase.from('kanban_clients').delete().eq('id', id);
        toast('Cliente excluído');
        loadClients();
    }

    if (loading) return <AppShell title="Clientes"><div className="loading"><div className="spinner" /><p>Carregando...</p></div></AppShell>;

    return (
        <AppShell title="Clientes">
            <div className="view-header">
                <div />
                <button className="btn btn-primary" onClick={() => openForm()}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Novo Cliente
                </button>
            </div>

            {!clients.length ? (
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                    <h3>Nenhum cliente</h3>
                    <p>Comece adicionando seu primeiro cliente.</p>
                    <button className="btn btn-primary" onClick={() => openForm()}>Adicionar Cliente</button>
                </div>
            ) : (
                <div className="grid">
                    {clients.map(c => (
                        <div key={c.id} className="grid-card" onClick={() => openForm(c)}>
                            <div className="grid-card-actions">
                                <button onClick={e => { e.stopPropagation(); openForm(c); }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                </button>
                                <button className="del" onClick={e => { e.stopPropagation(); deleteClient(c.id); }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                </button>
                            </div>
                            <div className="grid-card-header">
                                <div className="client-avatar">{c.avatar_url ? <img src={c.avatar_url} alt={c.name} /> : initials(c.name)}</div>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</h3>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{c.company || c.email || ''}</p>
                                </div>
                            </div>
                            <div className="grid-card-meta">
                                <span className={`badge badge-${c.status}`}>{STATUS_LABELS[c.status]}</span>
                                {c.phone && <span className="meta-tag">{c.phone}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <Modal title={editing ? 'Editar Cliente' : 'Novo Cliente'} onClose={() => setShowModal(false)}>
                    <div className="form-group"><label>Nome *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome do cliente" /></div>
                    <div className="form-row">
                        <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" /></div>
                        <div className="form-group"><label>Telefone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+55 11 9999-9999" /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Empresa</label><input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Nome da empresa" /></div>
                        <div className="form-group"><label>Nicho/Indústria (Público)</label><input value={form.industry_name} onChange={e => setForm({ ...form, industry_name: e.target.value })} placeholder="Ex: E-commerce, Saúde, etc" /></div>
                    </div>
                    <div className="form-group"><label>URL do Avatar</label><input value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." /></div>
                    <div className="form-group"><label>Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Ativo</option><option value="inactive">Inativo</option></select></div>
                    <div className="form-group"><label>Notas</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observações" /></div>
                    <div className="form-actions">
                        <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={saveClient}>Salvar</button>
                    </div>
                </Modal>
            )}
            <ConfirmDialog />
        </AppShell>
    );
}
