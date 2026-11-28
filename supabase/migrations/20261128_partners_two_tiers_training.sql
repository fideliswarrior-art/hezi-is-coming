-- ==============================================================================
-- HEZI FAM — MÓDULO DE PARCEIROS EM 2 NÍVEIS, MAPA DE TREINOS & CHECK-IN DIÁRIO
-- ==============================================================================

-- 1. EVOLUÇÃO DA TABELA DE PARCEIROS (Nível 1: event_only | Nível 2: qualified)
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS partner_tier TEXT NOT NULL DEFAULT 'event_only'
    CHECK (partner_tier IN ('event_only', 'qualified')),
  ADD COLUMN IF NOT EXISTS coach_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coach_display_name TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'RJ',
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS training_schedule_summary TEXT, -- Ex: "Terça e Quinta • 16:30 às 18:00"
  ADD COLUMN IF NOT EXISTS whatsapp_contact TEXT,
  ADD COLUMN IF NOT EXISTS is_map_visible BOOLEAN GENERATED ALWAYS AS (
    partner_tier = 'qualified' AND address IS NOT NULL AND address <> ''
  ) STORED;

-- 2. VÍNCULO DO ALUNO / ASSINANTE AO PROJETO OU ESCOLA BASE
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS base_partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS enrollment_status TEXT NOT NULL DEFAULT 'none'
    CHECK (enrollment_status IN ('none', 'regular', 'pendente', 'vencido')),
  ADD COLUMN IF NOT EXISTS class_label TEXT; -- Ex: "Turma Terça 16:30"

-- 3. TURMAS & HORÁRIOS FIXOS DO PARCEIRO QUALIFICADO
CREATE TABLE IF NOT EXISTS public.partner_training_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- Ex: "Treino Fundamentos & Competição"
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity SMALLINT NOT NULL DEFAULT 20,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_slots_partner_weekday
  ON public.partner_training_slots (partner_id, weekday)
  WHERE is_active = TRUE;

-- 4. CHECK-INS DE TREINO DIÁRIO (ALUNO SOLICITA -> PROFESSOR CONFIRMA)
CREATE TABLE IF NOT EXISTS public.training_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.partner_training_slots(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected')),
  gp_awarded INTEGER NOT NULL DEFAULT 0,
  confirmed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (partner_id, user_id, session_date)
);

CREATE INDEX IF NOT EXISTS idx_training_checkins_partner_date
  ON public.training_checkins (partner_id, session_date, status);

-- 5. HISTÓRICO DE AVALIAÇÕES OVR (COM TRAVA DE +5 OVR E ESCOPO DO PARCEIRO)
CREATE TABLE IF NOT EXISTS public.ovr_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  evaluator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  raw_drills JSONB NOT NULL, -- Notas /20 de cada nano-habilidade
  sub_ovrs JSONB NOT NULL,   -- { ban, arr, pla, cb, def, fis, qi }
  previous_ovr SMALLINT NOT NULL DEFAULT 65,
  calculated_ovr SMALLINT NOT NULL,
  final_ovr SMALLINT NOT NULL, -- Aplicado teto máximo de previous_ovr + 5
  coach_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ovr_evaluations_student
  ON public.ovr_evaluations (student_id, created_at DESC);
