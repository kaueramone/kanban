'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/types';
import AppShell from '@/components/AppShell';

export default function DashboardPage() {
  const [stats, setStats] = useState({ clients: 0, projects: 0, cards: 0, completed: 0 });
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<Record<string, number>>({ low: 0, medium: 0, high: 0, urgent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const [clientsRes, projectsRes, cardsRes, activityRes] = await Promise.all([
        supabase.from('kanban_clients').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('kanban_projects').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('kanban_cards').select('id, priority, deadline, column_id'),
        supabase.from('kanban_activity_log').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      const cards = cardsRes.data || [];
      const priCount: Record<string, number> = { low: 0, medium: 0, high: 0, urgent: 0 };
      cards.forEach(c => { if (priCount[c.priority] !== undefined) priCount[c.priority]++; });
      setPriorities(priCount);

      setStats({
        clients: clientsRes.count || 0,
        projects: projectsRes.count || 0,
        cards: cards.length,
        completed: 0,
      });

      // Upcoming deadlines
      const today = new Date().toISOString().split('T')[0];
      const week = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const { data: dls } = await supabase.from('kanban_cards')
        .select('id, title, deadline, project_id, kanban_projects(title)')
        .gte('deadline', today).lte('deadline', week).order('deadline').limit(8);
      setDeadlines(dls || []);

      setActivity(activityRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'agora';
    if (m < 60) return m + ' min atrás';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h atrás';
    return Math.floor(h / 24) + 'd atrás';
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  if (loading) return <AppShell title="Dashboard"><div className="loading"><div className="spinner" /><p>Carregando...</p></div></AppShell>;

  const maxPri = Math.max(1, ...Object.values(priorities));

  return (
    <AppShell title="Dashboard">
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <div className="stats-grid">
          <StatCard label="Clientes Ativos" value={stats.clients} color="#10b981" />
          <StatCard label="Projetos Ativos" value={stats.projects} color="#6366f1" />
          <StatCard label="Total de Tasks" value={stats.cards} color="#3b82f6" />
          <StatCard label="Concluídas" value={stats.completed} color="#f59e0b" />
        </div>

        <div className="dash-grid">
          <div className="dash-section">
            <div className="dash-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              Próximos Deadlines
            </div>
            {deadlines.length ? deadlines.map((dl: any) => (
              <div key={dl.id} className="deadline-item">
                <div className="deadline-info">
                  <strong>{dl.title}</strong>
                  <span>{(dl.kanban_projects as any)?.title || ''}</span>
                </div>
                <div className="deadline-date">{formatDate(dl.deadline)}</div>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 12 }}>Nenhum deadline próximo</p>}
          </div>

          <div className="dash-section">
            <div className="dash-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              Tasks por Prioridade
            </div>
            <div className="priority-chart">
              {Object.entries(priorities).map(([p, c]) => (
                <div key={p} className="priority-bar-row">
                  <div className="priority-bar-label">{PRIORITY_LABELS[p as keyof typeof PRIORITY_LABELS]}</div>
                  <div className="priority-bar-track">
                    <div className="priority-bar-fill" style={{ width: `${(c / maxPri) * 100}%`, background: PRIORITY_COLORS[p as keyof typeof PRIORITY_COLORS] }} />
                  </div>
                  <div className="priority-bar-count" style={{ color: PRIORITY_COLORS[p as keyof typeof PRIORITY_COLORS] }}>{c}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-section" style={{ gridColumn: '1/-1' }}>
            <div className="dash-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
              Atividade Recente
            </div>
            {activity.length ? activity.map((a: any) => (
              <div key={a.id} className="activity-item">
                <div className="activity-dot" />
                <div>
                  <div className="activity-text">{a.details}</div>
                  <div className="activity-time">{timeAgo(a.created_at)}</div>
                </div>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 12 }}>Nenhuma atividade registrada</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color } as React.CSSProperties}>
      <div className="stat-icon" style={{ background: color, opacity: 0.15 }} />
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}
