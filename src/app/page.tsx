import { createServerSupabase } from '@/lib/supabase-server';

export const revalidate = 300; // Revalida a cada 5 minutos

const ACTIVITY_POOL = [
  'Progresso realizado em uma tarefa de desenvolvimento',
  'Nova funcionalidade adicionada ao backlog do projeto',
  'Revisão de código concluída com sucesso',
  'Tarefa avançada para a próxima etapa do fluxo',
  'Componente de interface desenvolvido e validado',
  'Sprint atualizado com novas demandas do projeto',
  'Integração entre módulos concluída',
  'Refinamento de layout e experiência aplicado',
  'Correção identificada e implementada',
  'Build enviado para ambiente de homologação',
];

function getPhase(progress: number): string {
  if (progress === 0) return 'Kickoff';
  if (progress <= 25) return 'Planejamento';
  if (progress <= 55) return 'Desenvolvimento';
  if (progress <= 80) return 'Refinamento';
  return 'Finalização';
}

async function getData() {
  const sb = createServerSupabase();

  const ghHeaders: HeadersInit = process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {};

  const [projectsRes, activityRes, cardsCountRes, projsCountRes, ghUser, ghRepos] =
    await Promise.all([
      sb
        .from('kanban_projects')
        .select('id, public_name, deadline, kanban_clients(industry_name)')
        .eq('is_public', true)
        .eq('status', 'active'),
      sb
        .from('kanban_activity_log')
        .select('id, created_at, action')
        .order('created_at', { ascending: false })
        .limit(10),
      sb.from('kanban_cards').select('id', { count: 'exact', head: true }),
      sb
        .from('kanban_projects')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),
      fetch('https://api.github.com/users/kaueramone', {
        headers: ghHeaders,
        next: { revalidate: 3600 },
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(
        'https://api.github.com/users/kaueramone/repos?type=owner&sort=updated&per_page=4',
        { headers: ghHeaders, next: { revalidate: 3600 } }
      )
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ]);

  // Busca todos os cards dos projetos públicos de uma vez só (sem N+1)
  const projectIds = (projectsRes.data || []).map((p: any) => p.id);
  let allCards: any[] = [];
  if (projectIds.length > 0) {
    const { data: cards } = await sb
      .from('kanban_cards')
      .select('id, project_id, kanban_columns!inner(position)')
      .in('project_id', projectIds);
    allCards = cards || [];
  }

  // Agrupa cards por projeto
  const cardsByProject: Record<string, any[]> = {};
  allCards.forEach((c) => {
    if (!cardsByProject[c.project_id]) cardsByProject[c.project_id] = [];
    cardsByProject[c.project_id].push(c);
  });

  // Calcula progresso usando posição da coluna (mais robusto que título)
  const projects = (projectsRes.data || []).map((p: any) => {
    const cards = cardsByProject[p.id] || [];
    const total = cards.length;
    let progress = 0;
    if (total > 0) {
      const maxPos = Math.max(
        ...cards.map((c) => (c.kanban_columns as any).position as number)
      );
      const done = cards.filter(
        (c) => (c.kanban_columns as any).position === maxPos
      ).length;
      progress = Math.round((done / total) * 100);
    }

    const daysLeft = p.deadline
      ? Math.ceil(
          (new Date(p.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : null;

    return {
      id: p.id,
      name: p.public_name || 'Projeto Confidencial',
      niche: (p.kanban_clients as any)?.industry_name || 'Tech',
      progress,
      daysLeft,
    };
  });

  // Anonimiza atividades com pool rotativo
  const activity = (activityRes.data || []).map((a: any, i: number) => ({
    id: a.id,
    created_at: a.created_at,
    text: ACTIVITY_POOL[i % ACTIVITY_POOL.length],
  }));

  const offsetProjects = parseInt(process.env.STATS_OFFSET_PROJECTS || '12');
  const offsetTasks = parseInt(process.env.STATS_OFFSET_TASKS || '1450');

  const stats = {
    delivered: (projsCountRes.count || 0) + offsetProjects,
    tasks: (cardsCountRes.count || 0) + offsetTasks,
  };

  const fallbackGh = {
    avatar_url: 'https://github.com/kaueramone.png',
    html_url: 'https://github.com/kaueramone',
    name: 'Kaue Ramone',
    login: 'kaueramone',
    bio: 'Desenvolvedor Full Stack especializado em Next.js e Supabase.',
    public_repos: '50+',
    followers: '20+',
  };

  return {
    projects,
    activity,
    stats,
    githubStats: ghUser || fallbackGh,
    githubRepos: Array.isArray(ghRepos) ? ghRepos : [],
  };
}

export default async function PublicDashboard() {
  const { projects, activity, stats, githubStats, githubRepos } = await getData();
  const year = new Date().getFullYear();

  return (
    <div className="lp-wrap">
      <div className="lp-grid-bg" />

      {/* Nav */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo">
            Kanban<span>K</span>
          </div>
          <div className="lp-nav-links">
            <a href="https://kaueramone.dev" target="_blank" rel="noreferrer">
              Portfolio
            </a>
            <a href="/login" className="lp-admin-link">
              Admin
            </a>
          </div>
        </div>
      </nav>

      <main className="lp-main">
        {/* Hero */}
        <header className="lp-hero">
          <div className="lp-live-badge">
            <span className="lp-live-dot" />
            Live Tracking
          </div>

          <h1 className="lp-hero-title">
            O que Kaueramone está
            <br />
            <span className="lp-hero-highlight">construindo agora?</span>
          </h1>

          <p className="lp-hero-sub">
            Acompanhe meu processo de desenvolvimento e os projetos sendo forjados em
            tempo real. Transparência total no fluxo de trabalho.
          </p>

          <div className="lp-stats-row">
            <div className="lp-stat-box">
              <span className="lp-stat-num">{stats.delivered}+</span>
              <span className="lp-stat-label">Projetos Entregues</span>
            </div>
            <div className="lp-stat-box">
              <span className="lp-stat-num">{stats.tasks}+</span>
              <span className="lp-stat-label">Tarefas Concluídas</span>
            </div>
            <div className="lp-stat-box">
              <span className="lp-stat-num">+50k</span>
              <span className="lp-stat-label">Linhas de Código</span>
            </div>
          </div>
        </header>

        {/* Projetos ativos */}
        <section className="lp-section">
          <div className="lp-section-header">
            <h2>Projetos no Forno</h2>
            <span className="lp-pulsing-dot" />
          </div>

          <div className="lp-projects-grid">
            {projects.length === 0 ? (
              <div className="lp-empty">
                Nenhum projeto público ativo no momento.
              </div>
            ) : (
              projects.map((p) => (
                <div key={p.id} className="lp-project-card">
                  <div className="lp-card-glow" />
                  <div className="lp-card-top">
                    <span className="lp-niche-tag">{p.niche}</span>
                    <span className="lp-phase-tag">{getPhase(p.progress)}</span>
                  </div>
                  <h3 className="lp-project-name">{p.name}</h3>
                  <div className="lp-progress-area">
                    <div className="lp-progress-header">
                      <span>Progresso</span>
                      <span className="lp-progress-pct">{p.progress}%</span>
                    </div>
                    <div className="lp-progress-track">
                      <div
                        className="lp-progress-fill"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                  {p.daysLeft !== null && (
                    <div
                      className={`lp-deadline${p.daysLeft <= 7 ? ' lp-deadline-urgent' : ''}`}
                    >
                      {p.daysLeft > 0
                        ? `${p.daysLeft} dias restantes`
                        : p.daysLeft === 0
                          ? 'Entrega hoje'
                          : `Prazo encerrado há ${Math.abs(p.daysLeft)} dias`}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Feed de atividade */}
        <section className="lp-activity-section">
          <h2 className="lp-activity-title">Feed de Atividade</h2>
          <div>
            {activity.map((a, i) => (
              <div key={a.id} className="lp-act-item">
                <span className="lp-act-time">
                  {new Date(a.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <div className="lp-act-line">
                  <div
                    className={`lp-act-dot${i === 0 ? ' lp-act-dot-pulse' : ''}`}
                  />
                </div>
                <span className="lp-act-text">{a.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* GitHub */}
        <section className="lp-github-section">
          <div className="lp-section-header">
            <h2>GitHub & Open Source</h2>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ color: '#00ff88' }}
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </div>

          <div className="lp-github-grid">
            <div className="lp-gh-profile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={githubStats.avatar_url}
                alt={githubStats.name || 'GitHub Avatar'}
                className="lp-gh-avatar"
              />
              <h3>
                <a href={githubStats.html_url} target="_blank" rel="noreferrer">
                  {githubStats.name || githubStats.login}
                </a>
              </h3>
              <p>{githubStats.bio}</p>
              <div className="lp-gh-meta">
                <span>
                  <strong>{githubStats.public_repos}</strong> Repos
                </span>
                <span>
                  <strong>{githubStats.followers}</strong> Seguidores
                </span>
              </div>
            </div>

            <div className="lp-gh-repos">
              {githubRepos.map((r: any) => (
                <a
                  key={r.id}
                  href={r.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="lp-gh-repo"
                >
                  <div className="lp-gh-repo-top">
                    <h4>{r.name}</h4>
                    {r.language && (
                      <span className="lp-gh-lang">
                        <span className="lp-lang-dot" />
                        {r.language}
                      </span>
                    )}
                  </div>
                  <p>{r.description || 'Sem descrição.'}</p>
                  <div className="lp-gh-repo-footer">
                    <span>★ {r.stargazers_count}</span>
                    <span>
                      {new Date(r.updated_at).toLocaleDateString('pt-BR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="lp-cta">
          <div className="lp-cta-glow" />
          <h2>Vamos construir algo juntos?</h2>
          <p>Transformo suas ideias em sistemas digitais de alta performance.</p>
          <a
            href="https://kaueramone.dev"
            target="_blank"
            rel="noreferrer"
            className="lp-cta-btn"
          >
            Falar com Kaue
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </section>
      </main>

      <footer className="lp-footer">
        <p>© {year} Kaueramone.dev — Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
