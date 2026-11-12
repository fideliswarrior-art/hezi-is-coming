import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { HeziUser, HeziEventItem, HeziNotification } from "../hezi/store";

export const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || "https://qoxlbvvyjdtpwnhngkyj.supabase.co",
  anonKey: process.env.SUPABASE_ANON_KEY || "sb_publishable_bVB_-CGjjhvhnLSj5UQ5EA_yynyZ4T3",
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
};

let supabaseClientInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClientInstance) {
    const key = SUPABASE_CONFIG.serviceRoleKey || SUPABASE_CONFIG.anonKey;
    supabaseClientInstance = createClient(SUPABASE_CONFIG.url, key, {
      auth: { persistSession: false },
    });
  }
  return supabaseClientInstance;
}

/**
 * Salva o estado da plataforma HEZI no Supabase:
 * 1. Na tabela hezi_platform_state (snapshot instantâneo de alta performance)
 * 2. Na tabela relacional hezi_users (linhas com campos estruturados)
 * 3. Na tabela relacional hezi_events (eventos oficiais)
 */
export async function saveHeziToSupabase(
  hezi: {
    lastModified?: number;
    users?: HeziUser[];
    evs?: HeziEventItem[];
    notifications?: HeziNotification[];
  },
  updatedAt: number,
): Promise<boolean> {
  const sb = getSupabase();
  try {
    // 1. Snapshot na tabela hezi_platform_state
    const { error: stateErr } = await sb.from("hezi_platform_state").upsert(
      {
        id: 1,
        payload: hezi,
        updated_at: updatedAt,
      },
      { onConflict: "id" },
    );
    if (stateErr) {
      console.warn("[Supabase] Erro ao gravar hezi_platform_state:", stateErr.message);
    }

    // 2. Salva usuários na tabela relacional hezi_users
    if (hezi.users && Array.isArray(hezi.users)) {
      const activeIds = hezi.users.map((u) => u.id);
      if (activeIds.length > 0) {
        // Remove os excluídos
        await sb.from("hezi_users").delete().not("id", "in", `(${activeIds.join(",")})`);
      } else {
        await sb.from("hezi_users").delete().neq("id", 0);
      }

      for (const u of hezi.users) {
        const row = {
          id: u.id,
          tipo: u.tipo,
          nome: u.nome,
          username: u.username || null,
          apelido: u.apelido || null,
          email: u.email || null,
          senha: u.senha || null,
          data_nascimento: u.dataNascimento || null,
          instagram: u.instagram || null,
          pos: u.pos || "Armador",
          status_mensalidade: u.st || "ativo",
          hp: u.hp || 0,
          ofensiva: u.of || 0,
          foto: u.foto || null,
          avatar_icon: u.avatarIcon || null,
          whatsapp: u.wpp || null,
          sub_overalls: u.sub || null,
          nano_attempts: u.r || null,
          badges: u.bd || null,
          last_eval_date: u.ev?.d || null,
          last_eval_cycle: u.ev?.c || null,
          nota_tecnica: u.nota || "",
          email_verified: Boolean(u.emailVerified ?? true),
          verification_code: u.verificationCode || null,
          reset_code: u.resetCode || null,
          autorizacao_imagem: Boolean(u.autorizacaoImagem ?? true),
          autorizacao_imagem_data: u.autorizacaoImagemData || null,
        };

        const { error: uErr } = await sb.from("hezi_users").upsert(row, { onConflict: "id" });
        if (uErr) {
          console.warn("[Supabase] Erro ao gravar usuário:", u.nome, uErr.message);
        }
      }
    }

    // 3. Salva eventos na tabela hezi_events
    if (hezi.evs && Array.isArray(hezi.evs)) {
      for (const e of hezi.evs) {
        const evRow = {
          id: e.id,
          titulo: e.t,
          tipo: e.tp || "Pelada",
          quando: e.q,
          local: e.l,
          regras: e.r,
          ao_vivo_agora: Boolean(e.aoVivoAgora),
          ativo: true,
        };
        await sb.from("hezi_events").upsert(evRow, { onConflict: "id" });
      }
    }

    return true;
  } catch (err) {
    console.warn("[Supabase] saveHeziToSupabase falhou:", (err as Error).message);
    return false;
  }
}

/**
 * Salva o estado do totem Court Master no Supabase.
 */
export async function savePeladaToSupabase(
  pelada: Record<string, unknown>,
  updatedAt: number,
): Promise<boolean> {
  const sb = getSupabase();
  try {
    await sb.from("court_master_state").upsert(
      {
        id: 1,
        payload: pelada,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    return true;
  } catch (err) {
    console.warn("[Supabase] savePeladaToSupabase falhou:", (err as Error).message);
    return false;
  }
}

/**
 * Lê o estado completo do Supabase direto na nuvem.
 */
export async function loadFullSyncStateFromSupabase(): Promise<{
  pelada: Record<string, unknown> | null;
  peladaUpdatedAt: number;
  hezi: {
    lastModified?: number;
    users?: HeziUser[];
    evs?: HeziEventItem[];
    notifications?: HeziNotification[];
  } | null;
  heziUpdatedAt: number;
} | null> {
  const sb = getSupabase();
  try {
    // 1. Lê Court Master state
    let pelada: Record<string, unknown> | null = null;
    let peladaUpdatedAt = 0;
    const { data: cmRows } = await sb.from("court_master_state").select("*").eq("id", 1);
    if (cmRows && cmRows.length > 0) {
      pelada = cmRows[0].payload as Record<string, unknown>;
      peladaUpdatedAt = new Date(cmRows[0].updated_at).getTime() || 0;
    }

    // 2. Lê Hezi Platform state
    let hezi: {
      lastModified?: number;
      users?: HeziUser[];
      evs?: HeziEventItem[];
      notifications?: HeziNotification[];
    } | null = null;
    let heziUpdatedAt = 0;

    const { data: stateRows } = await sb.from("hezi_platform_state").select("*").eq("id", 1);
    if (stateRows && stateRows.length > 0 && stateRows[0].payload) {
      hezi = stateRows[0].payload;
      heziUpdatedAt = Number(stateRows[0].updated_at || 0);
    }

    // Se o state não continha usuários ou eventos, carrega das tabelas relacionais
    if (!hezi || !hezi.users || hezi.users.length === 0) {
      const { data: uRows } = await sb.from("hezi_users").select("*").order("id", { ascending: true });
      const { data: eRows } = await sb.from("hezi_events").select("*").eq("ativo", true).order("id", { ascending: true });
      const { data: nRows } = await sb.from("hezi_notifications").select("*").order("created_at", { ascending: false }).limit(100);

      if ((uRows && uRows.length > 0) || (eRows && eRows.length > 0)) {
        const users: HeziUser[] = (uRows || []).map((r: any) => ({
          id: Number(r.id),
          tipo: r.tipo,
          nome: r.nome,
          username: r.username || undefined,
          apelido: r.apelido || undefined,
          email: r.email || undefined,
          senha: r.senha || undefined,
          emailVerified: Boolean(r.email_verified),
          verificationCode: r.verification_code || undefined,
          resetCode: r.reset_code || undefined,
          resetCodeExpiresAt: r.reset_code_expires_at ? Number(r.reset_code_expires_at) : undefined,
          dataNascimento: r.data_nascimento || undefined,
          instagram: r.instagram || undefined,
          pos: r.pos || "Armador",
          st: r.status_mensalidade || "ativo",
          hp: Number(r.hp || 0),
          of: Number(r.ofensiva || 0),
          foto: r.foto || undefined,
          avatarIcon: r.avatar_icon || undefined,
          wpp: r.whatsapp || undefined,
          sub: r.sub_overalls || undefined,
          r: r.nano_attempts || undefined,
          bd: r.badges || undefined,
          ev: r.last_eval_date ? { d: r.last_eval_date, c: r.last_eval_cycle || "Mensal" } : null,
          nota: r.nota_tecnica || "",
          autorizacaoImagem: r.autorizacao_imagem !== null ? Boolean(r.autorizacao_imagem) : undefined,
          autorizacaoImagemData: r.autorizacao_imagem_data || undefined,
        }));

        const evs: HeziEventItem[] = (eRows || []).map((r: any) => ({
          id: Number(r.id),
          t: r.titulo,
          tp: r.tipo || "Pelada",
          q: r.quando,
          l: r.local,
          r: r.regras,
          f: [],
          rewardedUids: [],
          aoVivoAgora: Boolean(r.ao_vivo_agora),
        }));

        const notifications: HeziNotification[] = (nRows || []).map((r: any) => ({
          id: r.id,
          type: r.type,
          fromUserId: Number(r.from_user_id),
          fromUserName: r.from_user_name,
          toUserId: r.to_user_id ? Number(r.to_user_id) : undefined,
          toUserName: r.to_user_name || undefined,
          eventId: r.event_id ? Number(r.event_id) : undefined,
          eventTitle: r.event_title || undefined,
          createdAt: Number(r.created_at || Date.now()),
          timeLabel: r.time_label || "",
          status: r.status,
        }));

        const ts = Date.now();
        heziUpdatedAt = ts;
        hezi = {
          lastModified: ts,
          users,
          evs,
          notifications,
        };
      }
    }

    return {
      pelada,
      peladaUpdatedAt,
      hezi,
      heziUpdatedAt,
    };
  } catch (err) {
    console.warn("[Supabase] loadFullSyncStateFromSupabase falhou:", (err as Error).message);
    return null;
  }
}
