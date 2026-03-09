-- ============================================================
-- KANBAN PRO V2 - ATUALIZAÇÃO DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase Dashboard
-- NÃO REMOVE OS DADOS ATUAIS
-- ============================================================

-- Adiciona a coluna Nicho/Indústria à tabela de Clientes
ALTER TABLE kanban_clients
ADD COLUMN IF NOT EXISTS industry_name VARCHAR(255) DEFAULT '';

-- Adiciona as propriedades de visibilidade na tabela de Projetos
ALTER TABLE kanban_projects
ADD COLUMN IF NOT EXISTS public_name VARCHAR(255) DEFAULT '';

ALTER TABLE kanban_projects
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
