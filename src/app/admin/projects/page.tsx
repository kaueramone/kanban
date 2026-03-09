'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Project, PRIORITY_LABELS, STATUS_LABELS, PROJECT_COLORS } from '@/lib/types';
import AppShell from '@/components/AppShell';
import { Modal, ColorPicker } from '@/components/UI';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/UI';

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Project | null>(null);
    const { toast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();

    const [form, setForm] = useState({ title: '', public_name: '', is_public: true, client_id: '', description: '', status: 'active', priority: 'medium', color: '#6366f1', deadline: '', budget: '' });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        const [pRes, cRes] = await Promise.all([
            supabase.from('kanban_projects').select('*, kanban_clients(name)').order('created_at', { ascending: false }),
            supabase.from('kanban_clients').select('id, name').eq('status', 'active').order('name'),
        ]);
        const projs = (pRes.data || []).map((p: any) => ({ ...p, client_name: p.kanban_clients?.name || '' }));
        setProjects(projs);
        setClients(cRes.data || []);
        setLoading(false);
    }

    function openForm(project?: Project) {
        if (project) {
            setEditing(project);
            setForm({ title: project.title, public_name: project.public_name || '', is_public: project.is_public ?? true, client_id: String(project.client_id || ''), description: project.description, status: project.status, priority: project.priority, color: project.color, deadline: project.deadline || '', budget: String(project.budget || '') });
        } else {
            setEditing(null);
            setForm({ title: '', public_name: '', is_public: true, client_id: '', description: '', status: 'active', priority: 'medium', color: '#6366f1', deadline: '', budget: '' });
        }
        setShowModal(true);
    }

    async function saveProject() {
        if (!form.title.trim()) return toast('Título é obrigatório', 'error');
        const data = { ...form, client_id: form.client_id ? Number(form.client_id) : null, budget: form.budget ? Number(form.budget) : null, deadline: form.deadline || null };

        if (editing) {
            await supabase.from('kanban_projects').update(data).eq('id', editing.id);
            toast('Projeto atualizado!');
        } else {
            const { data: newProj } = await supabase.from('kanban_projects').insert(data).select().single();
            if (newProj) {
                const cols = [
                    { project_id: newProj.id, title: 'Backlog', color: '#64748b', position: 0 },
                    { project_id: newProj.id, title: 'Em Andamento', color: '#3b82f6', position: 1 },
                    { project_id: newProj.id, title: 'Revisão', color: '#f59e0b', position: 2 },
                    { project_id: newProj.id, title: 'Concluído', color: '#10b981', position: 3 },
                ];
                await supabase.from('kanban_columns').insert(cols);
            }
            toast('Projeto criado!');
        }
        setShowModal(false);
        loadData();
    }

    async function deleteProject(id: number) {
        if (!await confirm('Excluir Projeto', 'Todas as colunas e cards serão excluídos.')) return;
        await supabase.from('kanban_cards').delete().eq('project_id', id);
        await supabase.from('kanban_columns').delete().eq('project_id', id);
        await supabase.from('kanban_projects').delete().eq('id', id);
        toast('Projeto excluído');
        loadData();
    }

    if (loading) return <AppShell title="Projetos"><div className="loading"><div className="spinner" /><p>Carregando...</p></div></AppShell>;

    return (
        <AppShell title="Projetos">
            <div className="view-header">
                <div />
                <button className="btn btn-primary" onClick={() => openForm()}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Novo Projeto
                </button>
            </div>

            {!projects.length ? (
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                    <h3>Nenhum projeto</h3><p>Crie seu primeiro projeto.</p>
                    <button className="btn btn-primary" onClick={() => openForm()}>Criar Projeto</button>
                </div>
            ) : (
                <div className="grid">
                    {projects.map(p => (
                        <div key={p.id} className="grid-card" onClick={() => router.push(`/admin/board/${p.id}`)}>
                            <div className="project-color-bar" style={{ background: p.color }} />
                            <div className="grid-card-actions">
                                <button onClick={e => { e.stopPropagation(); openForm(p); }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                </button>
                                <button className="del" onClick={e => { e.stopPropagation(); deleteProject(p.id); }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                </button>
                            </div>
                            <div><h3 style={{ fontSize: 15, fontWeight: 600 }}>{p.title}</h3><p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{p.client_name || 'Sem cliente'}</p></div>
                            <div className="grid-card-meta" style={{ marginTop: 12 }}>
                                <span className={`badge badge-${p.status}`}>{STATUS_LABELS[p.status]}</span>
                                <span className={`badge badge-${p.priority}`}>{PRIORITY_LABELS[p.priority]}</span>
                                {p.deadline && <span className="meta-tag">{new Date(p.deadline).toLocaleDateString('pt-BR')}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <Modal title={editing ? 'Editar Projeto' : 'Novo Projeto'} onClose={() => setShowModal(false)}>
                    <div className="form-group"><label>Título Interno *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: E-commerce SuperMercadosX" /></div>
                    <div className="form-row">
                        <div className="form-group"><label>Nome Público</label><input value={form.public_name} onChange={e => setForm({ ...form, public_name: e.target.value })} placeholder="Ex: E-commerce Alimentício" /></div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                                <input type="checkbox" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                                Exibir no Dashboard Público
                            </label>
                        </div>
                    </div>
                    <div className="form-group"><label>Cliente</label><select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}><option value="">Sem cliente</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    <div className="form-group"><label>Descrição</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descrição do projeto" /></div>
                    <div className="form-row">
                        <div className="form-group"><label>Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Ativo</option><option value="paused">Pausado</option><option value="completed">Concluído</option><option value="archived">Arquivado</option></select></div>
                        <div className="form-group"><label>Prioridade</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Deadline</label><input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
                        <div className="form-group"><label>Orçamento (R$)</label><input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} step="0.01" placeholder="0.00" /></div>
                    </div>
                    <div className="form-group"><label>Cor</label><ColorPicker value={form.color} onChange={c => setForm({ ...form, color: c })} colors={PROJECT_COLORS} /></div>
                    <div className="form-actions">
                        <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={saveProject}>Salvar</button>
                    </div>
                </Modal>
            )}
            <ConfirmDialog />
        </AppShell>
    );
}
