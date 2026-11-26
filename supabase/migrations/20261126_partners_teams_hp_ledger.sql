-- ============================================================================
-- HEZI FAM® — Hub de Parceiros Licenciados, Times Oficiais & Motor HP v1.1
-- ============================================================================

-- 1. PARTNERS
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  bio text DEFAULT '',
  instagram text DEFAULT '',
  logo_url text DEFAULT '',
  banner_url text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. TEAMS (Times Oficiais 3x3 e 5x5)
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  modality text NOT NULL CHECK (modality IN ('3x3', '5x5')),
  captain_user_id bigint NOT NULL,
  logo_url text DEFAULT '',
  season_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now())::integer,
  swaps_used integer NOT NULL DEFAULT 0 CHECK (swaps_used >= 0 AND swaps_used <= 2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS teams_unique_name_ci
  ON teams (LOWER(TRIM(name)));

-- 3. TEAM ROSTER MEMBERS (Elenco da Temporada)
CREATE TABLE IF NOT EXISTS team_roster_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id bigint NOT NULL,
  season_year integer NOT NULL,
  modality text NOT NULL CHECK (modality IN ('3x3', '5x5')),
  is_active boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS team_roster_one_active_per_modality_season
  ON team_roster_members (user_id, modality, season_year)
  WHERE is_active = true;

-- 4. PARTNER CIRCUITS (Circuito Licenciado)
CREATE TABLE IF NOT EXISTS partner_circuits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  modality text NOT NULL CHECK (modality IN ('1x1', '3x3', '5x5', 'dunk', '3pt', 'skills')),
  sanction_tier text NOT NULL DEFAULT 'HEZI_50' CHECK (sanction_tier IN ('HEZI_50', 'HEZI_100', 'HEZI_250', 'HEZI_500', 'HEZI_1000')),
  description text DEFAULT '',
  rules_summary text DEFAULT '',
  status text NOT NULL DEFAULT 'em_breve' CHECK (status IN ('ativo', 'em_breve', 'encerrado')),
  pin_on_home boolean NOT NULL DEFAULT false,
  gp_participation_bonus integer NOT NULL DEFAULT 15,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. PARTNER SUB-EVENTS (Etapas)
CREATE TABLE IF NOT EXISTS partner_sub_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circuit_id uuid NOT NULL REFERENCES partner_circuits(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  title text NOT NULL,
  stage_order integer NOT NULL DEFAULT 1,
  category text NOT NULL DEFAULT 'open_masc' CHECK (category IN ('open_masc', 'open_fem', 'u18_masc', 'u18_fem', 'u16')),
  sanction_tier_override text NULL CHECK (sanction_tier_override IN ('HEZI_50', 'HEZI_100', 'HEZI_250', 'HEZI_500', 'HEZI_1000')),
  has_third_place_match boolean NOT NULL DEFAULT false,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  location text DEFAULT '',
  max_participants integer NOT NULL DEFAULT 16,
  status text NOT NULL DEFAULT 'aguardando_aprovacao' CHECK (status IN ('aguardando_aprovacao', 'inscricoes_abertas', 'em_andamento', 'aguardando_homologacao', 'homologada', 'cancelada')),
  homologated_at timestamptz NULL,
  homologated_by bigint NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. PARTNER REGISTRATIONS (Inscritos na Etapa)
CREATE TABLE IF NOT EXISTS partner_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_event_id uuid NOT NULL REFERENCES partner_sub_events(id) ON DELETE CASCADE,
  circuit_id uuid NOT NULL REFERENCES partner_circuits(id) ON DELETE CASCADE,
  user_id bigint NULL,
  team_id uuid NULL REFERENCES teams(id) ON DELETE SET NULL,
  participant_name text NOT NULL,
  roster_checkins jsonb NOT NULL DEFAULT '[]'::jsonb,
  checked_in boolean NOT NULL DEFAULT false,
  contact_whatsapp text DEFAULT '',
  instagram text DEFAULT '',
  approval_status text NOT NULL DEFAULT 'pendente' CHECK (approval_status IN ('pendente', 'confirmado', 'recusado', 'desclassificado')),
  final_placement integer NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. PARTNER MATCHES (Partidas / Súmula)
CREATE TABLE IF NOT EXISTS partner_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_event_id uuid NOT NULL REFERENCES partner_sub_events(id) ON DELETE CASCADE,
  round_name text NOT NULL,
  bracket_type text NOT NULL DEFAULT 'main_draw' CHECK (bracket_type IN ('main_draw', 'repechage', 'consolation')),
  is_final boolean NOT NULL DEFAULT false,
  is_third_place boolean NOT NULL DEFAULT false,
  player_a_id uuid NOT NULL REFERENCES partner_registrations(id) ON DELETE CASCADE,
  player_b_id uuid NULL REFERENCES partner_registrations(id) ON DELETE SET NULL,
  score_a integer NOT NULL DEFAULT 0,
  score_b integer NOT NULL DEFAULT 0,
  winner_id uuid NULL REFERENCES partner_registrations(id) ON DELETE SET NULL,
  result_type text NOT NULL DEFAULT 'played' CHECK (result_type IN ('played', 'wo', 'bye')),
  status text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'ao_vivo', 'finalizado')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. PARTNER PLAYER STATS (Estatísticas de Prestígio)
CREATE TABLE IF NOT EXISTS partner_player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES partner_matches(id) ON DELETE CASCADE,
  sub_event_id uuid NOT NULL REFERENCES partner_sub_events(id) ON DELETE CASCADE,
  circuit_id uuid NOT NULL REFERENCES partner_circuits(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES partner_registrations(id) ON DELETE CASCADE,
  user_id bigint NULL,
  player_name text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  two_pointers integer NOT NULL DEFAULT 0,
  three_pointers integer NOT NULL DEFAULT 0,
  rebounds integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  blocks_steals integer NOT NULL DEFAULT 0,
  is_mvp boolean NOT NULL DEFAULT false
);

-- 9. HP LEDGER (EXTRATO IMUTÁVEL DE HEZI POINTS — FONTE ÚNICA DA VERDADE)
CREATE TABLE IF NOT EXISTS hp_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint NULL,
  team_id uuid NULL REFERENCES teams(id) ON DELETE SET NULL,
  entry_scope text NOT NULL CHECK (entry_scope IN ('individual', 'team')),
  circuit_id uuid NOT NULL REFERENCES partner_circuits(id) ON DELETE CASCADE,
  sub_event_id uuid NOT NULL REFERENCES partner_sub_events(id) ON DELETE CASCADE,
  modality text NOT NULL CHECK (modality IN ('1x1', '3x3', '5x5')),
  category text NOT NULL CHECK (category IN ('open_masc', 'open_fem', 'u18_masc', 'u18_fem', 'u16')),
  season_year integer NOT NULL,
  effective_tier text NOT NULL,
  final_placement integer NOT NULL,
  real_wins_count integer NOT NULL DEFAULT 0,
  real_losses_count integer NOT NULL DEFAULT 0,
  point_diff_sum integer NOT NULL DEFAULT 0,
  placement_hp integer NOT NULL DEFAULT 0,
  win_bonus_hp integer NOT NULL DEFAULT 0,
  total_hp integer GENERATED ALWAYS AS (placement_hp + win_bonus_hp) STORED,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  revoke_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. PARTNER BADGES (Desafios Especiais & MVPs)
CREATE TABLE IF NOT EXISTS partner_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL,
  sub_event_id uuid NOT NULL REFERENCES partner_sub_events(id) ON DELETE CASCADE,
  badge_title text NOT NULL,
  badge_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_roster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_sub_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE hp_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_badges ENABLE ROW LEVEL SECURITY;

-- Leitura pública para atletas e visitantes
CREATE POLICY "Public read partners" ON partners FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read roster" ON team_roster_members FOR SELECT USING (true);
CREATE POLICY "Public read circuits" ON partner_circuits FOR SELECT USING (true);
CREATE POLICY "Public read sub_events" ON partner_sub_events FOR SELECT USING (true);
CREATE POLICY "Public read registrations" ON partner_registrations FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON partner_matches FOR SELECT USING (true);
CREATE POLICY "Public read stats" ON partner_player_stats FOR SELECT USING (true);
CREATE POLICY "Public read hp_ledger" ON hp_ledger FOR SELECT USING (true);
CREATE POLICY "Public read partner_badges" ON partner_badges FOR SELECT USING (true);
