'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/lib/supabase';
import { Column, Card, PRIORITY_LABELS, PROJECT_COLORS } from '@/lib/types';
import AppShell from '@/components/AppShell';
import { Modal, ColorPicker } from '@/components/UI';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/UI';

export default function BoardPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = Number(params.id);
    const [projectTitle, setProjectTitle] = useState('');
    const [columns, setColumns] = useState<Column[]>([]);
    const [loading, setLoading] = useState(true);
    const [showColModal, setShowColModal] = useState(false);
    const [showCardModal, setShowCardModal] = useState(false);
    const [editingCol, setEditingCol] = useState<Column | null>(null);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [activeColumnId, setActiveColumnId] = useState<number>(0);
    const { toast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();

    const [colForm, setColForm] = useState({ title: '', color: '#6366f1', wip_limit: 0 });
    const [cardForm, setCardForm] = useState({ title: '', description: '', priority: 'medium', label: '', label_color: '#6366f1', deadline: '', assigned_to: '', estimated_hours: '', cover_color: '' });

    const loadBoard = useCallback(async () => {
        const { data: proj } = await supabase.from('kanban_projects').select('title').eq('id', projectId).single();
        if (proj) setProjectTitle(proj.title);

        const { data: cols } = await supabase.from('kanban_columns').select('*').eq('project_id', projectId).order('position');
        const colsWithCards: Column[] = [];
        for (const col of (cols || [])) {
            const { data: cards } = await supabase.from('kanban_cards').select('*').eq('column_id', col.id).order('position');
            colsWithCards.push({ ...col, cards: cards || [] });
        }
        setColumns(colsWithCards);
        setLoading(false);
    }, [projectId]);

    useEffect(() => { loadBoard(); }, [loadBoard]);

    // Drag & Drop
    async function onDragEnd(result: DropResult) {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const cardId = Number(draggableId);
        const srcColId = Number(source.droppableId);
        const dstColId = Number(destination.droppableId);

        // Optimistic update
        const newCols = [...columns];
        const srcCol = newCols.find(c => c.id === srcColId)!;
        const dstCol = newCols.find(c => c.id === dstColId)!;
        const [movedCard] = srcCol.cards!.splice(source.index, 1);
        movedCard.column_id = dstColId;
        dstCol.cards!.splice(destination.index, 0, movedCard);
        setColumns(newCols);

        // Persist
        await supabase.from('kanban_cards').update({ column_id: dstColId, position: destination.index }).eq('id', cardId);

        // Reorder destination
        for (let i = 0; i < dstCol.cards!.length; i++) {
            await supabase.from('kanban_cards').update({ position: i }).eq('id', dstCol.cards![i].id);
        }

        // Reorder source if different
        if (srcColId !== dstColId) {
            for (let i = 0; i < srcCol.cards!.length; i++) {
                await supabase.from('kanban_cards').update({ position: i }).eq('id', srcCol.cards![i].id);
            }
            // Log activity
            const srcName = srcCol.title;
            const dstName = dstCol.title;
            await supabase.from('kanban_activity_log').insert({
                card_id: cardId, project_id: projectId, action: 'card_moved',
                details: `Card "${movedCard.title}" movido de "${srcName}" para "${dstName}"`
            });
        }
        toast('Card movido!', 'info');
    }

    // Column CRUD
    function openColForm(col?: Column) {
        setEditingCol(col || null);
        setColForm(col ? { title: col.title, color: col.color, wip_limit: col.wip_limit } : { title: '', color: '#6366f1', wip_limit: 0 });
        setShowColModal(true);
    }

    async function saveColumn() {
        if (!colForm.title.trim()) return toast('Título é obrigatório', 'error');
        if (editingCol) {
            await supabase.from('kanban_columns').update(colForm).eq('id', editingCol.id);
        } else {
            const maxPos = columns.length;
            await supabase.from('kanban_columns').insert({ ...colForm, project_id: projectId, position: maxPos });
        }
        toast('Coluna salva!');
        setShowColModal(false);
        loadBoard();
    }

    async function deleteColumn(id: number) {
        if (!await confirm('Excluir Coluna', 'Todos os cards desta coluna serão excluídos.')) return;
        await supabase.from('kanban_cards').delete().eq('column_id', id);
        await supabase.from('kanban_columns').delete().eq('id', id);
        toast('Coluna excluída');
        loadBoard();
    }

    // Card CRUD
    function openCardForm(columnId: number, card?: Card) {
        setActiveColumnId(columnId);
        setEditingCard(card || null);
        setCardForm(card ? {
            title: card.title, description: card.description, priority: card.priority,
            label: card.label, label_color: card.label_color, deadline: card.deadline || '',
            assigned_to: card.assigned_to, estimated_hours: String(card.estimated_hours || ''),
            cover_color: card.cover_color
        } : { title: '', description: '', priority: 'medium', label: '', label_color: '#6366f1', deadline: '', assigned_to: '', estimated_hours: '', cover_color: '' });
        setShowCardModal(true);
    }

    async function saveCard() {
        if (!cardForm.title.trim()) return toast('Título é obrigatório', 'error');
        const data = {
            ...cardForm, column_id: activeColumnId, project_id: projectId,
            deadline: cardForm.deadline || null,
            estimated_hours: cardForm.estimated_hours ? Number(cardForm.estimated_hours) : null,
        };
        if (editingCard) {
            await supabase.from('kanban_cards').update(data).eq('id', editingCard.id);
            toast('Card atualizado!');
        } else {
            const col = columns.find(c => c.id === activeColumnId);
            const pos = col?.cards?.length || 0;
            await supabase.from('kanban_cards').insert({ ...data, position: pos });
            toast('Card criado!');
            await supabase.from('kanban_activity_log').insert({
                card_id: null, project_id: projectId, action: 'card_created',
                details: `Card "${cardForm.title}" criado`
            });
        }
        setShowCardModal(false);
        loadBoard();
    }

    async function deleteCard(id: number) {
        if (!await confirm('Excluir Card', 'Esta tarefa será excluída permanentemente.')) return;
        await supabase.from('kanban_checklist').delete().eq('card_id', id);
        await supabase.from('kanban_cards').delete().eq('id', id);
        toast('Card excluído');
        loadBoard();
    }

    const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    if (loading) return <AppShell title="Kanban Board"><div className="loading"><div className="spinner" /><p>Carregando...</p></div></AppShell>;

    return (
        <AppShell title={projectTitle}>
            <div className="board-header">
                <div className="board-header-left">
                    <button className="back-btn" onClick={() => router.push('/projects')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                        Projetos
                    </button>
                    <h2 className="board-title">{projectTitle}</h2>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => openColForm()}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Coluna
                </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="columns-wrapper">
                    {columns.map(col => (
                        <div key={col.id} className="column">
                            <div className="column-header">
                                <div className="column-header-left">
                                    <div className="column-dot" style={{ background: col.color }} />
                                    <span className="column-title">{col.title}</span>
                                    <span className="column-count">{col.cards?.length || 0}</span>
                                </div>
                                <div className="column-actions">
                                    <button onClick={() => openColForm(col)} title="Editar">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                                    </button>
                                    <button onClick={() => deleteColumn(col.id)} title="Excluir">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                    </button>
                                </div>
                            </div>

                            <Droppable droppableId={String(col.id)}>
                                {(provided, snapshot) => (
                                    <div className={`column-cards ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                                        ref={provided.innerRef} {...provided.droppableProps}>
                                        {(col.cards || []).map((card, idx) => (
                                            <Draggable key={card.id} draggableId={String(card.id)} index={idx}>
                                                {(prov, snap) => (
                                                    <div className={`card ${snap.isDragging ? 'dragging' : ''}`}
                                                        ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                                        onClick={() => openCardForm(col.id, card)}>
                                                        {card.cover_color && <div className="card-cover" style={{ background: card.cover_color }} />}
                                                        {card.label && <div className="card-labels"><span className="card-label" style={{ background: card.label_color }}>{card.label}</span></div>}
                                                        <div className="card-title">{card.title}</div>
                                                        <div className="card-footer">
                                                            <div className="card-badges">
                                                                <span className="priority-dot" style={{ background: `var(--priority-${card.priority})` }} />
                                                                {card.deadline && (
                                                                    <span className={`card-badge ${new Date(card.deadline) < new Date() ? 'overdue' : ''}`}>
                                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /></svg>
                                                                        {formatDate(card.deadline)}
                                                                    </span>
                                                                )}
                                                                {card.checklist_total > 0 && <span className="card-badge">✓ {card.checklist_done}/{card.checklist_total}</span>}
                                                            </div>
                                                            {card.assigned_to && (
                                                                <div className="card-assigned" title={card.assigned_to}>
                                                                    {card.assigned_to.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>

                            <div className="column-footer">
                                <button className="add-card-btn" onClick={() => openCardForm(col.id)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Adicionar card
                                </button>
                            </div>
                        </div>
                    ))}

                    <div className="add-column" onClick={() => openColForm()}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Adicionar coluna
                    </div>
                </div>
            </DragDropContext>

            {showColModal && (
                <Modal title={editingCol ? 'Editar Coluna' : 'Nova Coluna'} onClose={() => setShowColModal(false)}>
                    <div className="form-group"><label>Título *</label><input value={colForm.title} onChange={e => setColForm({ ...colForm, title: e.target.value })} placeholder="Nome da coluna" /></div>
                    <div className="form-group"><label>Limite WIP (0 = sem limite)</label><input type="number" value={colForm.wip_limit} onChange={e => setColForm({ ...colForm, wip_limit: Number(e.target.value) })} min={0} /></div>
                    <div className="form-group"><label>Cor</label><ColorPicker value={colForm.color} onChange={c => setColForm({ ...colForm, color: c })} colors={PROJECT_COLORS} /></div>
                    <div className="form-actions">
                        <button className="btn btn-secondary" onClick={() => setShowColModal(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={saveColumn}>Salvar</button>
                    </div>
                </Modal>
            )}

            {showCardModal && (
                <Modal title={editingCard ? 'Editar Card' : 'Novo Card'} onClose={() => setShowCardModal(false)}>
                    <div className="form-group"><label>Título *</label><input value={cardForm.title} onChange={e => setCardForm({ ...cardForm, title: e.target.value })} placeholder="Título do card" /></div>
                    <div className="form-group"><label>Descrição</label><textarea value={cardForm.description} onChange={e => setCardForm({ ...cardForm, description: e.target.value })} placeholder="Detalhes da tarefa" /></div>
                    <div className="form-row">
                        <div className="form-group"><label>Prioridade</label><select value={cardForm.priority} onChange={e => setCardForm({ ...cardForm, priority: e.target.value })}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></div>
                        <div className="form-group"><label>Deadline</label><input type="date" value={cardForm.deadline} onChange={e => setCardForm({ ...cardForm, deadline: e.target.value })} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Label</label><input value={cardForm.label} onChange={e => setCardForm({ ...cardForm, label: e.target.value })} placeholder="Ex: Design, Dev, Bug" /></div>
                        <div className="form-group"><label>Responsável</label><input value={cardForm.assigned_to} onChange={e => setCardForm({ ...cardForm, assigned_to: e.target.value })} placeholder="Nome" /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Horas Estimadas</label><input type="number" value={cardForm.estimated_hours} onChange={e => setCardForm({ ...cardForm, estimated_hours: e.target.value })} step="0.5" min="0" /></div>
                        <div className="form-group"><label>Cor da Label</label><ColorPicker value={cardForm.label_color} onChange={c => setCardForm({ ...cardForm, label_color: c })} colors={PROJECT_COLORS} /></div>
                    </div>
                    {editingCard && (
                        <div className="form-actions" style={{ borderTop: 'none', paddingTop: 0 }}>
                            <button className="btn btn-danger btn-sm" onClick={() => { setShowCardModal(false); deleteCard(editingCard.id); }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg> Excluir Card
                            </button>
                        </div>
                    )}
                    <div className="form-actions">
                        <button className="btn btn-secondary" onClick={() => setShowCardModal(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={saveCard}>Salvar</button>
                    </div>
                </Modal>
            )}
            <ConfirmDialog />
        </AppShell>
    );
}
