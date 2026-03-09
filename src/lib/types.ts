export interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    company: string;
    industry_name: string;
    avatar_url: string;
    notes: string;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
    project_count?: number;
}

export interface Project {
    id: number;
    client_id: number | null;
    title: string;
    public_name: string;
    is_public: boolean;
    description: string;
    status: 'active' | 'paused' | 'completed' | 'archived';
    priority: Priority;
    color: string;
    deadline: string | null;
    budget: number | null;
    created_at: string;
    updated_at: string;
    client_name?: string;
    total_cards?: number;
    completed_cards?: number;
}

export interface Column {
    id: number;
    project_id: number;
    title: string;
    position: number;
    color: string;
    wip_limit: number;
    created_at: string;
    cards?: Card[];
}

export interface Card {
    id: number;
    column_id: number;
    project_id: number;
    title: string;
    description: string;
    priority: Priority;
    label: string;
    label_color: string;
    deadline: string | null;
    position: number;
    assigned_to: string;
    estimated_hours: number | null;
    checklist_total: number;
    checklist_done: number;
    cover_color: string;
    created_at: string;
    updated_at: string;
    checklist?: ChecklistItem[];
}

export interface ChecklistItem {
    id: number;
    card_id: number;
    text: string;
    is_done: boolean;
    position: number;
    created_at: string;
}

export interface ActivityLog {
    id: number;
    card_id: number | null;
    project_id: number | null;
    action: string;
    details: string;
    user_id: string | null;
    created_at: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';
export type ClientStatus = 'active' | 'inactive';

export const PRIORITY_COLORS: Record<Priority, string> = {
    low: '#22d3ee',
    medium: '#a78bfa',
    high: '#f59e0b',
    urgent: '#ef4444',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente',
};

export const STATUS_LABELS: Record<string, string> = {
    active: 'Ativo',
    paused: 'Pausado',
    completed: 'Concluído',
    archived: 'Arquivado',
    inactive: 'Inativo',
};

export const PROJECT_COLORS = [
    '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#64748b',
];
