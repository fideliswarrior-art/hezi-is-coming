import { Client, type ClientConfig } from "pg";
import type { HeziUser, HeziEventItem, HeziNotification } from "../hezi/store";

export const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || "https://qoxlbvvyjdtpwnhngkyj.supabase.co",
  anonKey: process.env.SUPABASE_ANON_KEY || "sb_publishable_bVB_-CGjjhvhnLSj5UQ5EA_yynyZ4T3",
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  dbPassword: process.env.SUPABASE_DB_PASSWORD || process.env.PGPASSWORD || "",
  dbHost: process.env.SUPABASE_DB_HOST || "db.qoxlbvvyjdtpwnhngkyj.supabase.co",
  dbPort: Number(process.env.SUPABASE_DB_PORT || 5432),
  dbUser: process.env.SUPABASE_DB_USER || "postgres",
  dbName: process.env.SUPABASE_DB_NAME || "postgres",
};

function getPgConfig(): ClientConfig | null {
  const password = SUPABASE_CONFIG.dbPassword;
  if (!password) {
    return null;
  }
  return {
    host: SUPABASE_CONFIG.dbHost,
    port: SUPABASE_CONFIG.dbPort,
    user: SUPABASE_CONFIG.dbUser,
    password,
    database: SUPABASE_CONFIG.dbName,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  };
}

/**
 * Executa uma operação no Supabase Postgres com retry automático.
 */
async function withSupabaseClient<T>(fn: (client: Client) => Promise<T>): Promise<T | null> {
  const conf = getPgConfig();
  if (!conf) return null;

  const client = new Client(conf);
  try {
    await client.connect();
    const result = await fn(client);
    return result;
  } catch (err) {
    console.warn("[Supabase] Operação em background indisponível:", (err as Error).message);
    return null;
  } finally {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Salva o estado da plataforma HEZI no Supabase:
 * 1. Na tabela hezi_platform_state (snapshot de alta performance)
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
  const res = await withSupabaseClient(async (client) => {
    // 1. Atualiza ou insere o snapshot na tabela hezi_platform_state
    const payloadJson = JSON.stringify(hezi);
    await client.query(
      `
      INSERT INTO public.hezi_platform_state (id, payload, updated_at)
      VALUES (1, $1::jsonb, $2)
      ON CONFLICT (id) DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = EXCLUDED.updated_at
      WHERE EXCLUDED.updated_at >= public.hezi_platform_state.updated_at;
    `,
      [payloadJson, updatedAt],
    );

    // 2. Salva os usuários na tabela relacional hezi_users
    if (hezi.users && Array.isArray(hezi.users)) {
      for (const u of hezi.users) {
        const subJson = u.sub ? JSON.stringify(u.sub) : null;
        const nanoJson = u.r ? JSON.stringify(u.r) : null;
        const badgesJson = u.bd ? JSON.stringify(u.bd) : null;

        await client.query(
          `
          INSERT INTO public.hezi_users (
            id, tipo, nome, username, apelido, email, data_nascimento,
            instagram, pos, status_mensalidade, hp, ofensiva, foto,
            avatar_icon, whatsapp, sub_overalls, nano_attempts, badges,
            last_eval_date, last_eval_cycle, nota_tecnica, email_verified,
            verification_code, reset_code, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13,
            $14, $15, $16::jsonb, $17::jsonb, $18::jsonb,
            $19, $20, $21, $22,
            $23, $24, NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            tipo = EXCLUDED.tipo,
            nome = EXCLUDED.nome,
            username = EXCLUDED.username,
            apelido = EXCLUDED.apelido,
            email = EXCLUDED.email,
            data_nascimento = EXCLUDED.data_nascimento,
            instagram = EXCLUDED.instagram,
            pos = EXCLUDED.pos,
            status_mensalidade = EXCLUDED.status_mensalidade,
            hp = EXCLUDED.hp,
            ofensiva = EXCLUDED.ofensiva,
            foto = EXCLUDED.foto,
            avatar_icon = EXCLUDED.avatar_icon,
            whatsapp = EXCLUDED.whatsapp,
            sub_overalls = EXCLUDED.sub_overalls,
            nano_attempts = EXCLUDED.nano_attempts,
            badges = EXCLUDED.badges,
            last_eval_date = EXCLUDED.last_eval_date,
            last_eval_cycle = EXCLUDED.last_eval_cycle,
            nota_tecnica = EXCLUDED.nota_tecnica,
            email_verified = EXCLUDED.email_verified,
            verification_code = EXCLUDED.verification_code,
            reset_code = EXCLUDED.reset_code,
            updated_at = NOW();
        `,
          [
            u.id,
            u.tipo,
            u.nome,
            u.username || null,
            u.apelido || null,
            u.email || null,
            u.dataNascimento || null,
            u.instagram || null,
            u.pos || "Armador",
            u.st || null,
            u.hp || 0,
            u.of || 0,
            u.foto || null,
            u.avatarIcon || null,
            u.wpp || null,
            subJson,
            nanoJson,
            badgesJson,
            u.ev?.d || null,
            u.ev?.c || null,
            u.nota || "",
            u.emailVerified ?? true,
            u.verificationCode || null,
            u.resetCode || null,
          ],
        );
      }
    }

    // 3. Salva os eventos na tabela relacional hezi_events
    if (hezi.evs && Array.isArray(hezi.evs)) {
      for (const e of hezi.evs) {
        await client.query(
          `
          INSERT INTO public.hezi_events (
            id, titulo, tipo, quando, local, regras, ao_vivo_agora, ativo
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
          ON CONFLICT (id) DO UPDATE SET
            titulo = EXCLUDED.titulo,
            tipo = EXCLUDED.tipo,
            quando = EXCLUDED.quando,
            local = EXCLUDED.local,
            regras = EXCLUDED.regras,
            ao_vivo_agora = EXCLUDED.ao_vivo_agora;
        `,
          [
            e.id,
            e.t,
            e.tp || "Pelada",
            e.q,
            e.l,
            e.r,
            Boolean(e.aoVivoAgora),
          ],
        );
      }
    }

    return true;
  });

  return Boolean(res);
}

/**
 * Salva o estado do totem Court Master no Supabase.
 */
export async function savePeladaToSupabase(
  pelada: Record<string, unknown>,
  updatedAt: number,
): Promise<boolean> {
  const res = await withSupabaseClient(async (client) => {
    const payloadJson = JSON.stringify(pelada);
    await client.query(
      `
      INSERT INTO public.court_master_state (id, payload, updated_at)
      VALUES (1, $1::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = NOW();
    `,
      [payloadJson],
    );
    return true;
  });

  return Boolean(res);
}

/**
 * Lê o estado completo do Supabase caso precise carregar ou sincronizar na nuvem.
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
  return await withSupabaseClient(async (client) => {
    // 1. Lê Court Master state
    const cmRes = await client.query(
      `SELECT payload, EXTRACT(EPOCH FROM updated_at) * 1000 AS ts FROM public.court_master_state WHERE id = 1`,
    );
    let pelada: Record<string, unknown> | null = null;
    let peladaUpdatedAt = 0;
    if (cmRes.rows.length > 0) {
      pelada = cmRes.rows[0].payload as Record<string, unknown>;
      peladaUpdatedAt = Number(cmRes.rows[0].ts || 0);
    }

    // 2. Lê Hezi Platform state
    const heziRes = await client.query(
      `SELECT payload, updated_at FROM public.hezi_platform_state WHERE id = 1`,
    );
    let hezi: {
      lastModified?: number;
      users?: HeziUser[];
      evs?: HeziEventItem[];
      notifications?: HeziNotification[];
    } | null = null;
    let heziUpdatedAt = 0;
    if (heziRes.rows.length > 0) {
      hezi = heziRes.rows[0].payload;
      heziUpdatedAt = Number(heziRes.rows[0].updated_at || 0);
    }

    return {
      pelada,
      peladaUpdatedAt,
      hezi,
      heziUpdatedAt,
    };
  });
}
