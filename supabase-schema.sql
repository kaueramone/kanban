-- ============================================================
-- KANBAN PRO - Supabase Database Schema
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS kanban_clients (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    company VARCHAR(255) DEFAULT '',
    avatar_url VARCHAR(500) DEFAULT '',
    notes TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Projetos
CREATE TABLE IF NOT EXISTS kanban_projects (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT REFERENCES kanban_clients(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    color VARCHAR(7) DEFAULT '#6366f1',
    deadline DATE,
    budget DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Colunas
CREATE TABLE IF NOT EXISTS kanban_columns (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES kanban_projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    position INT DEFAULT 0,
    color VARCHAR(7) DEFAULT '#6366f1',
    wip_limit INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Cards
CREATE TABLE IF NOT EXISTS kanban_cards (
    id BIGSERIAL PRIMARY KEY,
    column_id BIGINT NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
    project_id BIGINT NOT NULL REFERENCES kanban_projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    label VARCHAR(100) DEFAULT '',
    label_color VARCHAR(7) DEFAULT '#6366f1',
    deadline DATE,
    position INT DEFAULT 0,
    assigned_to VARCHAR(255) DEFAULT '',
    estimated_hours DECIMAL(5,1),
    checklist_total INT DEFAULT 0,
    checklist_done INT DEFAULT 0,
    cover_color VARCHAR(7) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Checklist
CREATE TABLE IF NOT EXISTS kanban_checklist (
    id BIGSERIAL PRIMARY KEY,
    card_id BIGINT NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
    text VARCHAR(500) NOT NULL,
    is_done BOOLEAN DEFAULT FALSE,
    position INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Activity Log
CREATE TABLE IF NOT EXISTS kanban_activity_log (
    id BIGSERIAL PRIMARY KEY,
    card_id BIGINT,
    project_id BIGINT,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_client ON kanban_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_columns_project ON kanban_columns(project_id);
CREATE INDEX IF NOT EXISTS idx_cards_column ON kanban_cards(column_id);
CREATE INDEX IF NOT EXISTS idx_cards_project ON kanban_cards(project_id);
CREATE INDEX IF NOT EXISTS idx_checklist_card ON kanban_checklist(card_id);
CREATE INDEX IF NOT EXISTS idx_activity_project ON kanban_activity_log(project_id);

-- RLS Policies (permissao publica para simplicidade)
ALTER TABLE kanban_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies - Allow all for authenticated and anon (adjust as needed)
CREATE POLICY "Allow all on kanban_clients" ON kanban_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on kanban_projects" ON kanban_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on kanban_columns" ON kanban_columns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on kanban_cards" ON kanban_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on kanban_checklist" ON kanban_checklist FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on kanban_activity_log" ON kanban_activity_log FOR ALL USING (true) WITH CHECK (true);
