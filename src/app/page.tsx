'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PublicDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({ delivered: 0, tasks: 0 });
  const [githubStats, setGithubStats] = useState<any>(null);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPublicData(); }, []);

  async function loadPublicData() {
    // 1. Load active public projects
    const { data: pData } = await supabase.from('kanban_projects')
      .select('id, public_name, status, kanban_clients(industry_name)')
      .eq('is_public', true)
      .eq('status', 'active');

    const projs = await Promise.all((pData || []).map(async (p: any) => {
      const { data: cards } = await supabase.from('kanban_cards').select('id, kanban_columns(title)').eq('project_id', p.id);
      const total = cards?.length || 0;
      const done = cards?.filter(c => (c.kanban_columns as any)?.title === 'Concluído').length || 0;
      const progress = total === 0 ? 0 : Math.round((done / total) * 100);

      return {
        id: p.id,
        name: p.public_name || 'Secret Project',
        niche: p.kanban_clients?.industry_name || 'Tech',
        progress
      };
    }));

    setProjects(projs);

    // 2. Load recent activity and anonymize
    const { data: aData } = await supabase.from('kanban_activity_log')
      .select('id, created_at, action, details')
      .order('created_at', { ascending: false })
      .limit(8);

    // Abstract the details.
    const anonActivity = (aData || []).map(a => {
      let text = a.details;
      if (a.action === 'card_moved') text = 'Progress made on a task';
      if (a.action === 'card_created') text = 'New feature added to the scope';
      return { ...a, details: text };
    });
    setActivity(anonActivity);

    // 3. Fake/Real Stats
    const { count: completedCards } = await supabase.from('kanban_cards').select('id', { count: 'exact', head: true });
    const { count: completedProjs } = await supabase.from('kanban_projects').select('id', { count: 'exact', head: true }).eq('status', 'completed');

    setStats({
      delivered: (completedProjs || 0) + 12, // + historical buffer
      tasks: (completedCards || 0) + 1450
    });

    // 4. Load GitHub Data
    try {
      const [uRes, rRes] = await Promise.all([
        fetch('https://api.github.com/users/kaueramone'),
        fetch('https://api.github.com/users/kaueramone/repos?type=owner&sort=updated&per_page=4')
      ]);
      if (uRes.ok && rRes.ok) {
        setGithubStats(await uRes.json());
        setGithubRepos(await rRes.json());
      }
    } catch (e) { console.error('GitHub fetch error', e); }

    setLoading(false);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="public-wrap">
      <nav className="public-nav">
        <div className="nav-logo">Kanban<span>K</span></div>
        <div className="nav-links">
          <a href="https://kaueramone.dev" target="_blank" rel="noreferrer">Portfolio</a>
          <a href="/login" className="login-link">Admin</a>
        </div>
      </nav>

      <main className="public-main">
        <header className="hero">
          <div className="hero-badge">Live Tracking</div>
          <h1>What is Kaueramone<br /><span className="highlight">building right now?</span></h1>
          <p>Follow my development process and the projects currently being forged. Full transparency in the workflow.</p>
          <div className="hero-stats">
            <div className="stat-box">
              <h3>{stats.delivered}</h3>
              <span>Delivered Projects</span>
            </div>
            <div className="stat-box">
              <h3>{stats.tasks}</h3>
              <span>Completed Tasks</span>
            </div>
            <div className="stat-box">
              <h3>+50k</h3>
              <span>Lines of Code Written</span>
            </div>
          </div>
        </header>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Active Projects in the Oven</h2>
            <div className="pulsing-dot" />
          </div>

          <div className="projects-grid">
            {projects.length === 0 ? (
              <div className="empty-projects">No active public projects at the moment.</div>
            ) : projects.map(p => (
              <div key={p.id} className="pub-card">
                <div className="pub-card-niche">{p.niche}</div>
                <h3 className="pub-card-title">{p.name}</h3>
                <div className="pub-card-progress">
                  <div className="progress-header">
                    <span>Development Progress</span>
                    <span>{p.progress}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="activity-section">
          <h2>Activity Feed</h2>
          <div className="activity-list">
            {activity.map(a => (
              <div key={a.id} className="act-item">
                <div className="act-time">{new Date(a.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                <div className="act-line"><div className="act-dot" /></div>
                <div className="act-text">{a.details}</div>
              </div>
            ))}
          </div>
        </section>

        {githubStats && (
          <section className="github-section">
            <div className="section-header">
              <h2>GitHub & Open Source</h2>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
            </div>
            <div className="github-grid">
              <div className="github-profile-card">
                <img src={githubStats.avatar_url} alt="GitHub Avatar" className="gh-avatar" />
                <div>
                  <h3><a href={githubStats.html_url} target="_blank" rel="noreferrer">{githubStats.name || githubStats.login}</a></h3>
                  <p>{githubStats.bio}</p>
                  <div className="gh-stats">
                    <span><strong>{githubStats.public_repos}</strong> Repos</span>
                    <span><strong>{githubStats.followers}</strong> Followers</span>
                  </div>
                </div>
              </div>
              <div className="github-repos">
                {githubRepos.map(r => (
                  <a key={r.id} href={r.html_url} target="_blank" rel="noreferrer" className="gh-repo-card">
                    <div className="gh-repo-header">
                      <h4>{r.name}</h4>
                      {r.language && <span className="gh-lang"><span className="gh-lang-dot" /> {r.language}</span>}
                    </div>
                    <p>{r.description || 'No description provided.'}</p>
                    <div className="gh-repo-meta">
                      <span>★ {r.stargazers_count}</span>
                      <span>Updated {(new Date(r.updated_at)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="cta-section">
          <h2>Want to see your project here?</h2>
          <p>Let's turn your idea into a digital system of excellence.</p>
          <a href="https://kaueramone.dev" target="_blank" rel="noreferrer" className="btn-glow">Start Project</a>
        </section>
      </main>

      <footer className="public-footer">
        <p>© {new Date().getFullYear()} Kaueramone.dev. All rights reserved.</p>
      </footer>

      <style jsx>{`
        .public-wrap {
          background-color: #030303;
          color: #ededed;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }
        .public-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 5%;
          max-width: 1200px;
          margin: 0 auto;
        }
        .nav-logo {
          font-weight: 800;
          font-size: 20px;
          letter-spacing: -0.5px;
        }
        .nav-logo span {
          color: #22c55e;
        }
        .nav-links a {
          color: #a3a3a3;
          text-decoration: none;
          margin-left: 24px;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: #fff; }
        .login-link { padding: 8px 16px; border-radius: 6px; background: rgba(255,255,255,0.05); }
        .login-link:hover { background: rgba(255,255,255,0.1); }

        .public-main {
          max-width: 1000px;
          margin: 0 auto;
          padding: 60px 5% 100px;
        }
        .hero {
          text-align: center;
          margin-bottom: 80px;
        }
        .hero-badge {
          display: inline-block;
          padding: 6px 16px;
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 24px;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }
        .hero h1 {
          font-size: 56px;
          line-height: 1.1;
          font-weight: 800;
          margin-bottom: 24px;
          letter-spacing: -1.5px;
        }
        .highlight {
          background: linear-gradient(to right, #22c55e, #10b981, #047857);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero p {
          color: #a3a3a3;
          font-size: 20px;
          max-width: 600px;
          margin: 0 auto 48px;
          line-height: 1.6;
        }
        .hero-stats {
          display: flex;
          justify-content: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        .stat-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 24px 40px;
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }
        .stat-box h3 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px;
        }
        .stat-box span {
          color: #737373;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .dashboard-section {
          margin-bottom: 80px;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
        }
        .section-header h2 {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }
        .pulsing-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }
        .pub-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: transform 0.3s, border-color 0.3s;
        }
        .pub-card:hover {
          transform: translateY(-4px);
          border-color: rgba(34, 197, 94, 0.3);
        }
        .pub-card-niche {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #4ade80;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .pub-card-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 24px;
        }
        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #a3a3a3;
          margin-bottom: 8px;
          font-weight: 500;
        }
        .progress-track {
          height: 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #22c55e, #10b981);
          border-radius: 4px;
          transition: width 1s ease-out;
        }

        .activity-section {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 24px;
          padding: 40px;
          margin-bottom: 80px;
        }
        .activity-section h2 { margin-top: 0; margin-bottom: 32px; font-size: 24px; }
        .act-item {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
        }
        .act-item:last-child { margin-bottom: 0; }
        .act-time {
          color: #737373;
          font-size: 13px;
          min-width: 140px;
          text-align: right;
          padding-top: 2px;
        }
        .act-line {
          position: relative;
          width: 2px;
          background: rgba(255,255,255,0.05);
        }
        .act-dot {
          position: absolute;
          top: 6px;
          left: -4px;
          width: 10px;
          height: 10px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 10px #22c55e;
        }
        .act-text {
          color: #d4d4d4;
          font-size: 15px;
          padding-bottom: 24px;
        }
        .act-item:last-child .act-text { padding-bottom: 0; }

        .github-section { margin-bottom: 80px; }
        .github-section .section-header svg { color: #22c55e; }
        .github-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
        }
        .github-profile-card {
          background: rgba(34, 197, 94, 0.05);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 16px;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
        }
        .gh-avatar {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          border: 2px solid #22c55e;
          padding: 4px;
        }
        .github-profile-card h3 { margin: 0 0 8px; font-size: 20px; }
        .github-profile-card h3 a { color: #fff; text-decoration: none; transition: color 0.2s; }
        .github-profile-card h3 a:hover { color: #22c55e; }
        .github-profile-card p { color: #a3a3a3; font-size: 14px; line-height: 1.5; margin: 0; }
        .gh-stats { display: flex; gap: 16px; margin-top: 8px; font-size: 13px; color: #a3a3a3; justify-content: center; }
        .gh-stats strong { color: #fff; }
        
        .github-repos {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .gh-repo-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          transition: transform 0.2s, border-color 0.2s;
        }
        .gh-repo-card:hover { transform: translateY(-2px); border-color: rgba(34, 197, 94, 0.3); }
        .gh-repo-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .gh-repo-header h4 { color: #fff; margin: 0; font-size: 16px; word-break: break-all; padding-right: 8px; }
        .gh-lang { font-size: 11px; color: #a3a3a3; display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .gh-lang-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; }
        .gh-repo-card p {
          color: #737373;
          font-size: 13px;
          line-height: 1.5;
          margin: 0 0 16px;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .gh-repo-meta { display: flex; gap: 12px; font-size: 12px; color: #525252; }

        .cta-section {
          text-align: center;
          padding: 80px 0;
          background: radial-gradient(circle at center, rgba(34,197,94,0.1) 0%, transparent 60%);
        }
        .cta-section h2 { font-size: 40px; margin-bottom: 16px; letter-spacing: -1px; }
        .cta-section p { color: #a3a3a3; font-size: 18px; margin-bottom: 40px; }
        .btn-glow {
          display: inline-block;
          background: #fff;
          color: #000;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 100px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 0 30px rgba(255,255,255,0.2);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-glow:hover {
          transform: scale(1.05);
          box-shadow: 0 0 50px rgba(255,255,255,0.4);
        }

        .public-footer {
          text-align: center;
          padding: 32px 5%;
          border-top: 1px solid rgba(255,255,255,0.05);
          color: #525252;
          font-size: 13px;
        }

        @media (max-width: 768px) {
          .hero h1 { font-size: 40px; }
          .hero p { font-size: 16px; }
          .act-item { flex-direction: column; gap: 8px; }
          .act-time { text-align: left; }
          .act-line { display: none; }
          .github-grid { grid-template-columns: 1fr; }
          .github-repos { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
