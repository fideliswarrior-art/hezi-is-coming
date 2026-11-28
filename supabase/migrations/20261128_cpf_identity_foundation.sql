-- ==============================================================================
-- HEZI FAM — FUNDAÇÃO DE IDENTIDADE POR CPF (PREPARAÇÃO PARA CPF OBRIGATÓRIO)
-- ==============================================================================

-- 1. Coluna CPF normalizada (11 dígitos) em public.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS cpf_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Trava de formato: se preenchido, deve conter exatamente 11 dígitos numéricos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_cpf_digits_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_cpf_digits_check
      CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$');
  END IF;
END $$;

-- Unicidade de CPF (permite NULL enquanto legados não preenchem)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_cpf
  ON public.users (cpf)
  WHERE cpf IS NOT NULL;

-- 2. CPF opcional em inscrições de etapas para reconciliação de avulsos
ALTER TABLE public.partner_registrations
  ADD COLUMN IF NOT EXISTS cpf TEXT;

CREATE INDEX IF NOT EXISTS idx_partner_registrations_cpf
  ON public.partner_registrations (cpf)
  WHERE cpf IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS registrations_unique_cpf_sub_event
  ON public.partner_registrations (sub_event_id, cpf)
  WHERE cpf IS NOT NULL;
