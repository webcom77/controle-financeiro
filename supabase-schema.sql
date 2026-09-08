-- =========================================================================
-- CONTROLE FINANCEIRO - SCRIPT DE CRIAÇÃO DO BANCO NO SUPABASE
-- Execute este script no SQL Editor do seu painel Supabase (https://supabase.com)
-- =========================================================================

-- 1. TABELA DE CONFIGURAÇÕES DO SISTEMA
CREATE TABLE IF NOT EXISTS public.settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    default_interest_rate NUMERIC(5,2) DEFAULT 6.80,
    late_penalty_pct NUMERIC(5,2) DEFAULT 2.00,
    late_mora_monthly_pct NUMERIC(5,2) DEFAULT 1.00,
    theme TEXT DEFAULT 'dark',
    alert_days_before INTEGER DEFAULT 7,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração padrão inicial se não existir
INSERT INTO public.settings (id, default_interest_rate, late_penalty_pct, late_mora_monthly_pct, theme, alert_days_before)
VALUES (1, 6.80, 2.00, 1.00, 'dark', 7)
ON CONFLICT (id) DO NOTHING;

-- 2. TABELA DE CLIENTES / TOMADORES
CREATE TABLE IF NOT EXISTS public.borrowers (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    document TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE EMPRÉSTIMOS
CREATE TABLE IF NOT EXISTS public.loans (
    id BIGINT PRIMARY KEY,
    borrower_id BIGINT REFERENCES public.borrowers(id) ON DELETE CASCADE,
    principal_amount NUMERIC(12,2) NOT NULL,
    monthly_interest_rate NUMERIC(5,2) NOT NULL,
    installments_count INTEGER NOT NULL,
    start_date DATE NOT NULL,
    first_due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE PARCELAS
CREATE TABLE IF NOT EXISTS public.installments (
    id BIGINT PRIMARY KEY,
    loan_id BIGINT REFERENCES public.loans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    original_amount NUMERIC(12,2) NOT NULL,
    principal_part NUMERIC(12,2) NOT NULL,
    interest_part NUMERIC(12,2) NOT NULL,
    paid_amount NUMERIC(12,2),
    paid_date DATE,
    payment_method TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE HISTÓRICO DE PAGAMENTOS
CREATE TABLE IF NOT EXISTS public.payments (
    id BIGINT PRIMARY KEY,
    installment_id BIGINT,
    loan_id BIGINT,
    borrower_name TEXT NOT NULL,
    installment_number INTEGER NOT NULL,
    total_installments INTEGER NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE NOT NULL,
    original_amount NUMERIC(12,2) NOT NULL,
    paid_amount NUMERIC(12,2) NOT NULL,
    principal_recovered NUMERIC(12,2) NOT NULL,
    interest_realized NUMERIC(12,2) NOT NULL,
    charges_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HABILITAR REALTIME NAS TABELAS
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.borrowers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.installments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- CONFIGURAR POLÍTICAS DE ACESSO (Row Level Security - RLS)
-- Permite leitura e escrita públicas com a chave pública anon do Supabase

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on borrowers" ON public.borrowers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on loans" ON public.loans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on installments" ON public.installments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
