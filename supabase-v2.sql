-- ============================================================
-- KANBAN PRO V2 - Novos campos para Dashboard Público
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- Adiciona Nicho/Indústria no Cliente
ALTER TABLE kanban_clients
ADD COLUMN IF NOT EXISTS industry_name VARCHAR(100) DEFAULT '';

-- Adiciona Nome Público e Flag Público no Projeto
ALTER TABLE kanban_projects
ADD COLUMN IF NOT EXISTS public_name VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
