-- ============================================================================
-- HEZI FAM - Hardening: Unicidade, Integridade e Índices de Performance
-- ============================================================================

-- 1. Corrigir unicidade de nome do time (permite 3x3 e 5x5 ou nova temporada)
DROP INDEX IF EXISTS teams_unique_name_ci;
CREATE UNIQUE INDEX IF NOT EXISTS teams_unique_name_modality_season_ci
  ON teams (LOWER(TRIM(name)), modality, season_year);

-- 2. Impedir HP duplicado ativo na mesma etapa + validar escopo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hp_ledger_scope_target_check'
  ) THEN
    ALTER TABLE hp_ledger
      ADD CONSTRAINT hp_ledger_scope_target_check CHECK (
        (entry_scope = 'individual' AND user_id IS NOT NULL AND team_id IS NULL)
        OR
        (entry_scope = 'team' AND team_id IS NOT NULL)
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS hp_ledger_unique_active_individual
  ON hp_ledger (sub_event_id, user_id)
  WHERE status = 'active' AND entry_scope = 'individual';

CREATE UNIQUE INDEX IF NOT EXISTS hp_ledger_unique_active_team
  ON hp_ledger (sub_event_id, team_id)
  WHERE status = 'active' AND entry_scope = 'team';

-- 3. Impedir inscrição duplicada na mesma etapa
CREATE UNIQUE INDEX IF NOT EXISTS registrations_unique_user_sub_event
  ON partner_registrations (sub_event_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS registrations_unique_team_sub_event
  ON partner_registrations (sub_event_id, team_id)
  WHERE team_id IS NOT NULL;

-- 4. Travas básicas de sanidade em datas e placares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sub_events_valid_dates'
  ) THEN
    ALTER TABLE partner_sub_events
      ADD CONSTRAINT sub_events_valid_dates CHECK (end_date >= start_date);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'matches_non_negative_scores'
  ) THEN
    ALTER TABLE partner_matches
      ADD CONSTRAINT matches_non_negative_scores CHECK (score_a >= 0 AND score_b >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'matches_distinct_players'
  ) THEN
    ALTER TABLE partner_matches
      ADD CONSTRAINT matches_distinct_players CHECK (player_b_id IS NULL OR player_a_id <> player_b_id);
  END IF;
END $$;

-- 5. Índices de performance (Ranking, Etapas, Chaves e Estatísticas)
CREATE INDEX IF NOT EXISTS idx_hp_ledger_ranking
  ON hp_ledger (season_year, modality, category, entry_scope)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_hp_ledger_user ON hp_ledger (user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_hp_ledger_team ON hp_ledger (team_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sub_events_circuit ON partner_sub_events (circuit_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_sub_event ON partner_registrations (sub_event_id);
CREATE INDEX IF NOT EXISTS idx_matches_sub_event ON partner_matches (sub_event_id, status);
CREATE INDEX IF NOT EXISTS idx_player_stats_match ON partner_player_stats (match_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_user ON partner_player_stats (user_id);
